import { Inject, Injectable } from '@nestjs/common';
import { OrderAddress } from '../../custom-customer-plugin/gql/generated';
import { Logger } from '@vendure/core';
import axios from 'axios';
import { DRIVING_PROFILE_MAPPING, loggerCtx, SHARED_PLUGIN_OPTIONS } from '../constants';
import {
  DistanceResult,
  DrivingProfile,
  GeocodingResult,
  OrsGeocodingResponse,
  OrsResponse,
  PluginInitOptions,
} from '../types';

/**
 * REF:- https://openrouteservice.org/dev/#/api-docs
 */

@Injectable()
export class ORSService {
  private memCache = new Map<string, string>();

  constructor(@Inject(SHARED_PLUGIN_OPTIONS) private options: PluginInitOptions) {
    if (!this.options.orsApiKey) {
      Logger.warn('ORS API key is required', loggerCtx);
      // throw new Error('ORS API key is required');
    }
  }

  async geocodeAddress(address: OrderAddress): Promise<GeocodingResult> {
    try {
      const cacheKey = `${JSON.stringify(address)}_ors`;
      if (this.memCache.has(cacheKey)) {
        return JSON.parse(this.memCache.get(cacheKey)!) as GeocodingResult;
      }

      const query = [
        address.streetLine1,
        address.streetLine2,
        address.city,
        address.province,
        address.postalCode,
        address.country,
      ]
        .filter(Boolean)
        .join(', ');

      const res = await axios.get<OrsGeocodingResponse>('https://api.openrouteservice.org/geocode/search', {
        params: { text: query, size: 1, api_key: this.options.orsApiKey },
        timeout: 15000,
      });

      if (!res.data.features || res.data.features.length === 0) {
        const error = new Error(`No ORS geocoding results found for query: "${query}"`);
        error.name = 'ORSGeocodingError';
        throw error;
      }

      const feature = res.data.features[0];
      const resultJson: GeocodingResult = {
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        displayName: feature.properties.name,
        confidence: feature.properties.confidence,
      };
      this.memCache.set(cacheKey, JSON.stringify(resultJson));
      return resultJson;
    } catch (error: any) {
      Logger.error(`Error geocoding with ORS: ${error.message}`, loggerCtx);
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
      const orsProfile = this.getProfile(profile);
      const orsUrl = `https://api.openrouteservice.org/v2/directions/${orsProfile.ors}/json`;
      const res = await axios.post<OrsResponse>(
        orsUrl,
        {
          coordinates: [
            [source.lon, source.lat],
            [destination.lon, destination.lat],
          ],
        },
        {
          headers: { Authorization: this.options.orsApiKey },
          timeout: 10000,
        },
      );

      const route = res.data?.routes?.[0];
      if (route && route.summary.distance > 0) {
        const resultJson: DistanceResult = {
          distanceKm: route.summary.distance / 1000,
          durationMinutes: route.summary.duration / 60,
          method: 'ors',
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
