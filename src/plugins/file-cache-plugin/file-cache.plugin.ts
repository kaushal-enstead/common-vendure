import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { FileCacheService } from './services/file-cache.service';
import { FileCacheAdminResolver } from './api/file-cache.admin.resolver';
import { adminApiExtensions } from './api/api-extenstions';
import { FILE_CACHE_PLUGIN_OPTIONS, fileCachePermissions } from './constants';
import { PluginInitOptions } from './types';
import * as path from 'path';
import { Module } from '@nestjs/common';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [
    {
      provide: FILE_CACHE_PLUGIN_OPTIONS,
      useFactory: () => FileCachePlugin.options,
    },
    FileCacheService,
  ],
  configuration: config => {
    // Plugin-specific configuration
    // such as custom fields, custom permissions,
    // strategies etc. can be configured here by
    // modifying the `config` object.
    config.authOptions.customPermissions.push(fileCachePermissions);
    return config;
  },
  compatibility: '^3.0.0',
  adminApiExtensions: {
    resolvers: [FileCacheAdminResolver],
    schema: adminApiExtensions,
  },
})
export class FileCachePlugin {
  static options: PluginInitOptions;

  static init(options: PluginInitOptions): Type<FileCachePlugin> {
    this.options = options;
    return FileCachePlugin;
  }
}

@Module({
  imports: [PluginCommonModule],
  providers: [
    {
      provide: FILE_CACHE_PLUGIN_OPTIONS,
      useFactory: () => FileCachePlugin.options,
    },
    FileCacheService,
  ],
  exports: [FileCacheService],
})
export class FileCachePluginModule {}
