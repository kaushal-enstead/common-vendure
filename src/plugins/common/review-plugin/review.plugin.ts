import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { adminApiExtensions, shopApiExtensions } from './api/api-extensions';
import { REVIEW_PLUGIN_OPTIONS, reviewPermissions } from './constants';
import { Review } from './entities/review.entity';
import { PluginInitOptions } from './types';
import { ReviewService } from './services/review.service';
import { ReviewResolver } from './api/review.resolver';
import * as path from 'path';
import { Module } from '@nestjs/common';

/** Declared first so dashboard Vite plugin discovery keeps the correct `ReviewPlugin` class name (see __decorate walk order). */
@Module({
  imports: [PluginCommonModule],
  providers: [
    {
      provide: REVIEW_PLUGIN_OPTIONS,
      useFactory: () => ReviewPlugin.options,
    },
    ReviewService,
  ],
  exports: [ReviewService],
})
export class ReviewPluginModule {}

@VendurePlugin({
  dashboard: './dashboard/index.tsx',
  imports: [PluginCommonModule],
  providers: [
    {
      provide: REVIEW_PLUGIN_OPTIONS,
      useFactory: () => ReviewPlugin.options,
    },
    ReviewService,
  ],
  entities: [Review],
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [ReviewResolver],
  },
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [ReviewResolver],
  },
  configuration: config => {
    config.authOptions.customPermissions.push(reviewPermissions);
    return config;
  },
  compatibility: '^3.0.0',
})
export class ReviewPlugin {
  static options: PluginInitOptions;

  static init(options: PluginInitOptions): Type<ReviewPlugin> {
    this.options = options;
    return ReviewPlugin;
  }
}
