import { CrudPermissionDefinition } from '@vendure/core';

export const BOOKING_PLUGIN_OPTIONS = Symbol('BOOKING_PLUGIN_OPTIONS');
export const loggerCtx = 'BookingPlugin';

export const bookingPermissions = new CrudPermissionDefinition('Booking');
