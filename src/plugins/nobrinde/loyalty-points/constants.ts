import { CrudPermissionDefinition } from '@vendure/core';

export const LOYALTY_POINTS_PLUGIN_OPTIONS = Symbol('LOYALTY_POINTS_PLUGIN_OPTIONS');
export const loggerCtx = 'LoyaltyPointsPlugin';
export const redeemActionCode = 'CUSTOM-redeem-loyalty-points';
export const conditionCode = 'CUSTOM-minimum_one_adhered_seller';

export const LoyaltyPointsPermissions = new CrudPermissionDefinition('LoyaltyPoints');
