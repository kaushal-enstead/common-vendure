import { CrudPermissionDefinition } from '@vendure/core';

export const FILE_CACHE_PLUGIN_OPTIONS = Symbol('FILE_CACHE_PLUGIN_OPTIONS');
export const loggerCtx = 'FileCachePlugin';

export const fileCachePermissions = new CrudPermissionDefinition('FileCache');
