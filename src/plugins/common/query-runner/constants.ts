import { PermissionDefinition } from '@vendure/core';

export const QUERY_RUNNER_PLUGIN_OPTIONS = Symbol('QUERY_RUNNER_PLUGIN_OPTIONS');
export const loggerCtx = 'QueryRunnerPlugin';

export const QueryRunnerPermissions = new PermissionDefinition({
  name: 'QueryRunner',
  description: 'Allows running SQL queries in the admin panel',
  assignable: true,
  internal: false,
});
