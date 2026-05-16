import { DrivingProfile } from './types';

export const SHARED_PLUGIN_OPTIONS = Symbol('SHARED_PLUGIN_OPTIONS');
export const loggerCtx = 'SharedPlugin';

export const DRIVING_PROFILE_MAPPING: Record<DrivingProfile, { osrm: string; ors: string }> = {
    bike: {
        osrm: 'cycling', // OSRM cycling profile
        ors: 'cycling-regular', // ORS standard cycling profile
    },
    cycle: {
        osrm: 'cycling', // same as bike
        ors: 'cycling-regular',
    },
    foot: {
        osrm: 'walking', // OSRM walking profile
        ors: 'foot-walking', // ORS foot walking
    },
    car: {
        osrm: 'driving', // OSRM driving profile
        ors: 'driving-car', // ORS driving car
    },
    van: {
        osrm: 'driving', // OSRM only has "driving"
        ors: 'driving-hgv', // ORS heavy goods vehicle (closest to van/truck)
    },
};
