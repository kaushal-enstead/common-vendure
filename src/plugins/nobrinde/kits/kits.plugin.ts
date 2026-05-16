import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { KIT_PLUGIN_OPTIONS, KitPermissions } from './constants';
import { PluginInitOptions } from './types';
import { Kit } from './entity/kit.entity';
import { KitAsset } from './entity/kit-asset.entity';
import { KitTranslation } from './entity/kit-translation.entity';
import { KitVariant } from './entity/kit-variant.entity';
import { adminApiExtensions } from './api/api-extensions';
import { KitResolver } from './api/kit.resolver';
import { KitEntityResolver, KitAdminEntityResolver } from './api/kit.entity.resolver';
import { KitService } from './services/kit.service';
import { KitVariantService } from './services/kit-variant.service';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [
    { provide: KIT_PLUGIN_OPTIONS, useFactory: () => KitPlugin.options },
    KitService,
    KitVariantService,
  ],
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [KitResolver, KitEntityResolver, KitAdminEntityResolver],
  },
  configuration: config => {
    config.authOptions.customPermissions.push(KitPermissions);
    return config;
  },
  compatibility: '^3.0.0',
  entities: [Kit, KitAsset, KitTranslation, KitVariant],
  dashboard: './dashboard/index.tsx',
})
export class KitPlugin {
  static options: PluginInitOptions;

  static init(options: PluginInitOptions): Type<KitPlugin> {
    this.options = options;
    return KitPlugin;
  }
}
