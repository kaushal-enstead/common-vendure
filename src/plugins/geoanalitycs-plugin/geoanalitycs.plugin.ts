import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';

import { GEOANALITYCS_PLUGIN_OPTIONS } from './constants';
import { PluginInitOptions } from './types';
import { GeoAnalyticsService } from './services/geoanalitycs.service';
import { GeoAnalyticsAdminResolver } from './api/geo-analitycs-admin.resolver';
import { adminApiExtensions } from './api/api-extensions';
import { FileCachePluginModule } from '../common';

@VendurePlugin({
  imports: [PluginCommonModule, FileCachePluginModule],
  providers: [
    {
      provide: GEOANALITYCS_PLUGIN_OPTIONS,
      useFactory: () => GeoAnalyticsPlugin.options,
    },
    GeoAnalyticsService,
  ],
  configuration: config => {
    // Plugin-specific configuration
    // such as custom fields, custom permissions,
    // strategies etc. can be configured here by
    // modifying the `config` object.
    return config;
  },
  compatibility: '^3.0.0',
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [GeoAnalyticsAdminResolver],
  },
  dashboard: './dashboard/index.tsx',
})
export class GeoAnalyticsPlugin {
  static options: PluginInitOptions;

  static init(options: PluginInitOptions): Type<GeoAnalyticsPlugin> {
    this.options = options;
    return GeoAnalyticsPlugin;
  }
}
