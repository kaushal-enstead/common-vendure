import { CrudPermissionDefinition } from '@vendure/core';

export const KIT_PLUGIN_OPTIONS = Symbol('KIT_PLUGIN_OPTIONS');
export const loggerCtx = 'KitPlugin';

export const KitPermissions = new CrudPermissionDefinition('Kit');
