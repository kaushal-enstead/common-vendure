import path from 'path';
import type { VendureConfig } from '@vendure/core';
import type { ProjectVendureConfig } from './types';

export function mergeProjectConfig(base: VendureConfig, project: ProjectVendureConfig): VendureConfig {
  const { migrationPath, plugins: projectPlugins = [], dbConnectionOptions: projectDb, ...rest } = project;

  return {
    ...base,
    ...rest,
    dbConnectionOptions: {
      ...base.dbConnectionOptions,
      ...projectDb,
      migrations: [path.join(process.cwd(), migrationPath, '*.+(js|ts)')],
    } as VendureConfig['dbConnectionOptions'],
    plugins: [...(base.plugins ?? []), ...projectPlugins],
  };
}
