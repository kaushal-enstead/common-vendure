import { OrderAddress } from '../custom-customer-plugin/gql/generated';

export type PluginInitOptions = {
  orsApiKey: string;
};

export type GeocodingResult = {
  lat: number;
  lon: number;
  displayName?: string;
  confidence?: number;
};

export type DistanceResult = {
  distanceKm: number;
  durationMinutes?: number;
  method: 'ors' | 'haversine' | 'route-project-osrm';
  source: GeocodingResult;
  destination: GeocodingResult;
};

export type AddressDistanceResult = {
  distanceKm: number;
  durationMinutes?: number;
  method: 'ors' | 'haversine' | 'route-project-osrm';
  sourceAddress: OrderAddress;
  destinationAddress: OrderAddress;
  sourceCoords: GeocodingResult;
  destinationCoords: GeocodingResult;
};

export type NominatimResponse = Array<{
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  place_id: number;
}>;

export type OrsGeocodingResponse = {
  features: Array<{
    geometry: {
      coordinates: [number, number]; // [lon, lat]
    };
    properties: {
      name: string;
      confidence: number;
    };
  }>;
};

export type OrsResponse = {
  bbox: number[];
  routes: {
    summary: { distance: number; duration: number };
    segments: {
      distance: number;
      duration: number;
      steps: {
        distance: number;
        duration: number;
        type: number;
        instruction: string;
        name: string;
        way_points: number[];
      }[];
    }[];
    bbox: number[];
    geometry: string;
    way_points: number[];
  }[];
  metadata: {
    attribution: string;
    service: string;
    timestamp: number;
    query: {
      coordinates: number[][];
      profile: string;
      profileName: string;
      format: string;
    };
    engine: {
      version: string;
      build_date: string;
      graph_date: string;
      osm_date: string;
    };
  };
};

export type RouteProjectOSRMResponse = {
  code: string;
  routes: Array<{
    geometry: string;
    legs: Array<{
      steps: any[];
      summary: string;
      weight: number;
      duration: number;
      distance: number;
    }>;
    weight_name: string;
    weight: number;
    duration: number;
    distance: number;
  }>;
  waypoints: Array<{
    hint: string;
    distance: number;
    name: string;
    location: [number, number];
  }>;
};

export type DrivingProfile = 'car' | 'bike' | 'foot' | 'van' | 'cycle';
