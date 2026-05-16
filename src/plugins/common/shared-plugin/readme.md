# Shared Plugin Documentation

This document describes the Shared Plugin that provides comprehensive geocoding and distance calculation capabilities using multiple services including Nominatim, OpenRouteService (ORS), and Project OSRM.

## Overview

The Shared Plugin is a Vendure plugin that provides geocoding and distance calculation services through two main service classes:

- **FreeGeoService**: Uses free services (Nominatim for geocoding, Project OSRM for routing)
- **ORSService**: Uses premium OpenRouteService for both geocoding and routing

## Features

### 1. Geocoding Services

- **Nominatim** (via FreeGeoService): Free OpenStreetMap geocoding service
- **OpenRouteService** (via ORSService): Premium geocoding service with higher accuracy

### 2. Distance Calculation

- **Project OSRM** (via FreeGeoService): Free routing service using OpenStreetMap data
- **OpenRouteService** (via ORSService): Premium routing service with multiple transport modes
- **Haversine Fallback**: Straight-line distance calculation with Portugal-specific corrections

### 3. Transport Modes

Both services support multiple transport modes:

| Mode    | OSRM Profile | ORS Profile     | Description    |
| ------- | ------------ | --------------- | -------------- |
| `car`   | driving      | driving-car     | Car/automobile |
| `bike`  | cycling      | cycling-regular | Bicycle        |
| `cycle` | cycling      | cycling-regular | Alias for bike |
| `foot`  | walking      | foot-walking    | Walking        |
| `van`   | driving      | driving-hgv     | Van/truck      |

### 4. Caching

Both services implement in-memory caching to improve performance and reduce API calls.

## Installation & Configuration

### 1. Install the Plugin

```typescript
import { SharedPlugin } from './plugins/shared-plugin/shared-plugin';

// In your Vendure config
export const config: VendureConfig = {
    plugins: [
        SharedPlugin.init({
            orsApiKey: 'your-ors-api-key-here', // Required for ORSService
        }),
        // ... other plugins
    ],
};
```

### 2. Inject Services

```typescript
import { FreeGeoService, ORSService } from './plugins/shared-plugin/services';

@Injectable()
export class YourService {
    constructor(
        private freeGeoService: FreeGeoService,
        private orsService: ORSService,
    ) {}
}
```

## API Reference

### FreeGeoService

#### `geocodeAddress(address: OrderAddress): Promise<GeocodingResult>`

Geocodes an address using Nominatim service.

**Parameters:**
- `address`: OrderAddress object with street, city, postal code, etc.

**Returns:**
```typescript
{
  lat: number;
  lon: number;
  displayName?: string;
  confidence?: number;
}
```

**Example:**
```typescript
const result = await freeGeoService.geocodeAddress({
    streetLine1: 'Rua Augusta 123',
    city: 'Lisboa',
    postalCode: '1100-048',
    country: 'Portugal',
});
```

#### `calculateDistanceBetweenPoints(source: {lat: number, lon: number}, destination: {lat: number, lon: number}, profile?: DrivingProfile): Promise<DistanceResult>`

Calculates distance between two coordinate points using Project OSRM with haversine fallback.

**Parameters:**
- `source`: Source coordinates {lat, lon}
- `destination`: Destination coordinates {lat, lon}
- `profile`: Transport mode - defaults to 'car'

**Returns:**
```typescript
{
  distanceKm: number;
  durationMinutes?: number;
  method: 'route-project-osrm' | 'haversine';
  source: GeocodingResult;
  destination: GeocodingResult;
}
```

**Example:**
```typescript
const result = await freeGeoService.calculateDistanceBetweenPoints(
    { lat: 38.7139, lon: -9.1393 }, // Lisboa
    { lat: 41.1579, lon: -8.6291 }, // Porto
    'car',
);
```

#### `haversineDistance(from: {lat: number, lon: number}, to: {lat: number, lon: number}): number`

Calculates straight-line distance with Portugal-specific corrections.

**Returns:** Distance in kilometers

#### `clearCache(): void`

Clears the in-memory cache.

### ORSService

#### `geocodeAddress(address: OrderAddress): Promise<GeocodingResult>`

Geocodes an address using OpenRouteService.

**Parameters:**
- `address`: OrderAddress object

**Returns:** Same as FreeGeoService.geocodeAddress()

#### `calculateDistanceBetweenPoints(source: {lat: number, lon: number}, destination: {lat: number, lon: number}, profile?: DrivingProfile): Promise<DistanceResult>`

Calculates distance between two coordinate points using OpenRouteService.

**Parameters:**
- `source`: Source coordinates {lat, lon}
- `destination`: Destination coordinates {lat, lon}
- `profile`: Transport mode - defaults to 'car'

**Returns:**
```typescript
{
  distanceKm: number;
  durationMinutes?: number;
  method: 'ors';
  source: GeocodingResult;
  destination: GeocodingResult;
}
```

## Type Definitions

### GeocodingResult
```typescript
{
  lat: number;
  lon: number;
  displayName?: string;
  confidence?: number;
}
```

### DistanceResult
```typescript
{
  distanceKm: number;
  durationMinutes?: number;
  method: 'ors' | 'haversine' | 'route-project-osrm';
  source: GeocodingResult;
  destination: GeocodingResult;
}
```

### DrivingProfile
```typescript
'car' | 'bike' | 'foot' | 'van' | 'cycle'
```

## Usage Examples

### Basic Geocoding

```typescript
// Using FreeGeoService (Nominatim)
const coords = await freeGeoService.geocodeAddress(address);

// Using ORSService
const coords = await orsService.geocodeAddress(address);
```

### Distance Calculations

```typescript
// Using FreeGeoService (Project OSRM + haversine fallback)
const distance = await freeGeoService.calculateDistanceBetweenPoints(
    source, 
    destination, 
    'car'
);

// Using ORSService
const distance = await orsService.calculateDistanceBetweenPoints(
    source, 
    destination, 
    'car'
);
```

### Complete Address-to-Address Distance

```typescript
async function calculateAddressDistance(
    sourceAddress: OrderAddress,
    destinationAddress: OrderAddress,
    useORS: boolean = false
): Promise<DistanceResult> {
    const geoService = useORS ? orsService : freeGeoService;
    
    // Geocode both addresses
    const sourceCoords = await geoService.geocodeAddress(sourceAddress);
    const destCoords = await geoService.geocodeAddress(destinationAddress);
    
    // Calculate distance
    return await geoService.calculateDistanceBetweenPoints(
        sourceCoords,
        destCoords,
        'car'
    );
}
```

## Error Handling

Both services include comprehensive error handling:

1. **Geocoding Failures**: Throws descriptive errors with error names
2. **Distance Calculation Fallback**: FreeGeoService falls back to haversine if OSRM fails
3. **API Timeouts**: 15-second timeout for all external API calls
4. **Graceful Degradation**: Services continue to work even with partial failures

## Performance Considerations

1. **Rate Limiting**: 
   - Nominatim: 1 request per second
   - Project OSRM: No strict limits but be respectful
   - ORS: Based on your plan quota

2. **Caching**: Both services implement in-memory caching to reduce API calls

3. **Timeout**: 15-second timeout for all external requests

4. **Portugal-Specific Optimizations**: Haversine calculations include distance factors based on Portuguese road networks

## Troubleshooting

### Common Issues

1. **ORS API Key Missing**: Ensure `orsApiKey` is provided in plugin configuration
2. **Geocoding Failures**: Check address format and completeness
3. **Timeout Errors**: Increase timeout values for slow connections
4. **Fallback to Haversine**: Indicates OSRM service is unavailable

### Debug Mode

Enable debug logging to see detailed error information:

```typescript
// Check logs for detailed error messages
Logger.error(`Error details: ${error.message}`, loggerCtx);
```

## Service Comparison

| Feature | FreeGeoService | ORSService |
|---------|----------------|------------|
| Geocoding | Nominatim (Free) | ORS (Premium) |
| Routing | Project OSRM (Free) | ORS (Premium) |
| Fallback | Haversine | None |
| Caching | In-memory | In-memory |
| Rate Limits | Yes | Based on plan |
| Accuracy | Good | Excellent |

## Notes

- Use **FreeGeoService** for cost-effective solutions with good accuracy
- Use **ORSService** for premium features and higher accuracy
