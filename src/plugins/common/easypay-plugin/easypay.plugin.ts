import { LanguageCode, PluginCommonModule, VendurePlugin } from '@vendure/core';
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
  configuration: config => {
    config.customFields.GlobalSettings.push({
      name: 'percentageFee',
      type: 'int',
      label: [
        { languageCode: LanguageCode.en, value: 'Percentage Fee' },
        { languageCode: LanguageCode.pt, value: 'Taxa Percentual' },
        { languageCode: LanguageCode.pt_PT, value: 'Taxa Percentual' },
      ],
      defaultValue: 0,
      ui: {
        tab: 'Platform Settings',
        component: 'number-form-input',
        suffix: '%',
      },
    });
    config.customFields.GlobalSettings.push({
      name: 'fixedFee',
      type: 'int',
      label: [
        { languageCode: LanguageCode.en, value: 'Fixed Fee' },
        { languageCode: LanguageCode.pt, value: 'Taxa Fixa' },
        { languageCode: LanguageCode.pt_PT, value: 'Taxa Fixa' },
      ],
      defaultValue: 0,
      ui: {
        tab: 'Platform Settings',
        component: 'currency-form-input',
      },
    });
    config.customFields.GlobalSettings.push({
      name: 'easypayAccountUid',
      type: 'string',
      label: [
        { languageCode: LanguageCode.en, value: 'Easypay Account UID' },
        { languageCode: LanguageCode.pt, value: 'UID da conta Easypay' },
        { languageCode: LanguageCode.pt_PT, value: 'UID da conta Easypay' },
      ],
      defaultValue: '',
      ui: {
        tab: 'Platform Settings',
        component: 'string',
      },
    });
    return config;
  },
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
