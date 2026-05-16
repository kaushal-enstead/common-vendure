import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { QUERY_RUNNER_PLUGIN_OPTIONS, QueryRunnerPermissions } from './constants';
import { QueryRunnerService } from './services/query-runner.service';
import { QueryRunnerResolver } from './api/query-runner.resolver';
import { adminApiExtensions } from './api/api-extensions';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [
    { provide: QUERY_RUNNER_PLUGIN_OPTIONS, useFactory: () => QueryRunnerPlugin.options },
    QueryRunnerService,
  ],
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [QueryRunnerResolver],
  },
  configuration: config => {
    config.authOptions.customPermissions.push(QueryRunnerPermissions);
    return config;
  },
  compatibility: '^3.0.0',
  dashboard: './dashboard/index.tsx',
})
export class QueryRunnerPlugin {
  static options: any;
  static init(options: any = {}): Type<QueryRunnerPlugin> {
    this.options = options;
    return QueryRunnerPlugin;
  }
}
