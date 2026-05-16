import { CrudPermissionDefinition } from '@vendure/core';

export const REVIEW_PLUGIN_OPTIONS = Symbol('REVIEW_PLUGIN_OPTIONS');
export const loggerCtx = 'ReviewPlugin';

export const reviewPermissions = new CrudPermissionDefinition('Review');
