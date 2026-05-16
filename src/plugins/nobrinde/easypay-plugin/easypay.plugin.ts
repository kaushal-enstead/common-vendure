import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { EASYPAY_PLUGIN_OPTIONS } from './constants';
import { PluginInitOptions } from './types';
import { EasypaySdkService } from './services/easypay-sdk.service';
import { EasypaySdkAdminResolver } from './api/easypay-sdk-admin.resolver';
import { EasypaySdkShopResolver } from './api/easypay-sdk-shop.resolver';
import { adminApiExtensions } from './api/admin-api-extensions';
import { shopApiExtensions } from './api/shop-api-extensions';
import { EasypayWebhookController } from './webhook/easypay-webhook.controller';
import { ActiveCartJanitorService } from './services/active-cart-janitor.service';

@VendurePlugin({
  imports: [PluginCommonModule],
  controllers: [EasypayWebhookController],
  providers: [
    { provide: EASYPAY_PLUGIN_OPTIONS, useFactory: () => EasypayPlugin.options },
    EasypaySdkService,
    ActiveCartJanitorService,
  ],
  exports: [EasypaySdkService],
  compatibility: '^3.0.0',
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [EasypaySdkAdminResolver],
  },
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [EasypaySdkShopResolver],
  },
})
export class EasypayPlugin {
  static options: PluginInitOptions;

  static init(options: PluginInitOptions) {
    EasypayPlugin.options = options;
    return EasypayPlugin;
  }
}
