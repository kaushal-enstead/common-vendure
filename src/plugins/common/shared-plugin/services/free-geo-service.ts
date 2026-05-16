import { Injectable } from '@nestjs/common';
import { Logger } from '@vendure/core';
import axios from 'axios';
import { DRIVING_PROFILE_MAPPING, loggerCtx } from '../constants';
import {
  DistanceResult,
  DrivingProfile,
  GeocodingResult,
  NominatimResponse,
  RouteProjectOSRMResponse,
} from '../types';
import { OrderAddress } from '../../custom-customer-plugin/gql/generated';

/**
 * REF:- https://project-osrm.org/docs/v5.24.0/api/#
 * REF:- https://nominatim.org/release-docs/develop/api/Overview/
 */

@Injectable()
export class FreeGeoService {
  private memCache = new Map<string, string>();

  async geocodeAddress(address: OrderAddress): Promise<GeocodingResult> {
    try {
      const cacheKey = `${JSON.stringify(address)}_nominatim`;
      if (this.memCache.has(cacheKey)) {
        return JSON.parse(this.memCache.get(cacheKey)!) as GeocodingResult;
      }

      const res = await axios.get<NominatimResponse>('https://nominatim.openstreetmap.org/search', {
        params: {
          street: [address.streetLine1, address.streetLine2].filter(Boolean).join(', '),
          city: address.city ?? address.province,
          postalcode: address.postalCode,
          country: address.country,
          format: 'json',
          limit: 1,
        },
        headers: { 'User-Agent': 'Bairros/1.0 (+dev@...)' },
        timeout: 15000,
      });

      if (!Array.isArray(res.data) || res.data.length === 0) {
        const error = new Error(
          `No Nominatim geocoding results found for query: "${JSON.stringify(address, null, 2)}"`,
        );
        error.name = 'NominatimGeocodingError';
        throw error;
      }

      const result = res.data[0];
      const resultJson: GeocodingResult = {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        displayName: result.display_name,
        confidence: result.importance,
      };
      this.memCache.set(cacheKey, JSON.stringify(resultJson));
      return resultJson;
    } catch (error: any) {
      Logger.error(`Error geocoding with Nominatim: ${error.message}`, loggerCtx);
      throw error;
    }
  }

  async calculateDistanceBetweenPoints(
    source: { lat: number; lon: number },
    destination: { lat: number; lon: number },
    profile: DrivingProfile = 'car',
  ): Promise<DistanceResult> {
    const sourceCoords: GeocodingResult = { lat: source.lat, lon: source.lon };
    const destCoords: GeocodingResult = { lat: destination.lat, lon: destination.lon };
    const cacheKey = `${JSON.stringify(sourceCoords)}_${JSON.stringify(destCoords)}_${profile}_ors`;

    if (this.memCache.has(cacheKey)) {
      return JSON.parse(this.memCache.get(cacheKey)!) as DistanceResult;
    }

    try {
      const osProfile = this.getProfile(profile);
      const osUrl = `https://router.project-osrm.org/route/v1/${osProfile.osrm}/${source.lon},${source.lat};${destination.lon},${destination.lat}`;
      const res = await axios.get<RouteProjectOSRMResponse>(osUrl, {
        params: { overview: 'false' },
      });
      const route = res.data?.routes?.[0];
      if (route) {
        const resultJson: DistanceResult = {
          distanceKm: route.distance / 1000,
          durationMinutes: route.duration / 60,
          method: 'route-project-osrm',
          source: sourceCoords,
          destination: destCoords,
        };
        this.memCache.set(cacheKey, JSON.stringify(resultJson));
        return resultJson;
      }
    } catch (error: any) {
      Logger.error(`Error calculating distance with ORS: ${error.message}`, loggerCtx);
    }

    const distance = this.haversineDistance(sourceCoords, destCoords);
    return { distanceKm: distance, method: 'haversine', source: sourceCoords, destination: destCoords };
  }

  haversineDistance(from: { lat: number; lon: number }, to: { lat: number; lon: number }): number {
    const R = 6371; // Earth radius in km
    const dLat = ((to.lat - from.lat) * Math.PI) / 180;
    const dLon = ((to.lon - from.lon) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const crowDistance = R * c; // distance in km

    // ---- Portugal-specific correction ----
    let factor = 1.3; // default
    if (crowDistance < 5)
      factor = 1.2; // short city trips
    else if (crowDistance < 20)
      factor = 1.3; // medium city trips
    else if (crowDistance < 100)
      factor = 1.4; // intercity trips
    else factor = 1.5; // very long intercity highways

    return crowDistance * factor;
  }

  private getProfile(mode: DrivingProfile): { osrm: string; ors: string } {
    return DRIVING_PROFILE_MAPPING[mode] || { osrm: 'driving', ors: 'driving-car' };
  }

  clearCache(): void {
    this.memCache.clear();
  }
}
