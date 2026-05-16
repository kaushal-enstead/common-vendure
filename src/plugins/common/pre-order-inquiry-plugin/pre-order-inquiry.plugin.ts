import { LanguageCode, PluginCommonModule, VendurePlugin } from '@vendure/core';
import path from 'path';
import { PreOrder } from './entities/pre-order.entity';
import { PreOrderService } from './services/pre-order.service';
import { PreOrderAdminResolver } from './api/pre-order-admin.resolver';
import { PreOrderShopResolver } from './api/pre-order-shop.resolver';
import { adminApiExtensions, shopApiExtensions } from './api/api-extensions';
import { PRE_ORDER_INQUIRY_PLUGIN_OPTIONS, preOrderPermissions } from './constants';
import { PluginInitOptions } from './types';
import { PreOrderListener } from './listener/pre-order.listener';
@VendurePlugin({
  imports: [PluginCommonModule],
  dashboard: './dashboard/index.tsx',
  entities: [PreOrder],
  providers: [
    PreOrderService,
    {
      provide: PRE_ORDER_INQUIRY_PLUGIN_OPTIONS,
      useFactory: (): PluginInitOptions => PreOrderInquiryPlugin.options,
    },
    PreOrderListener,
  ],
  compatibility: '^3.0.0',
  configuration: config => {
    config.customFields.OrderLine.push({
      name: 'preOrderId',
      type: 'string',
      defaultValue: '',
      readonly: true,
      description: [
        { languageCode: LanguageCode.en, value: 'The pre-order id for the order line' },
        { languageCode: LanguageCode.pt, value: 'O id da pré-venda para a linha de pedido' },
        { languageCode: LanguageCode.pt_PT, value: 'O id da pré-venda para a linha de pedido' },
      ],
    });
    config.customFields.Product.push({
      name: 'isPreOrder',
      type: 'boolean',
      label: [
        { languageCode: LanguageCode.en, value: 'Pre-order Product' },
        { languageCode: LanguageCode.pt, value: 'Produto de Pré-Encomenda' },
        { languageCode: LanguageCode.pt_PT, value: 'Produto de Pré-Encomenda' },
      ],
      ui: { tab: 'General' },
    });
    config.authOptions.customPermissions.push(preOrderPermissions);
    return config;
  },
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [PreOrderAdminResolver],
  },
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [PreOrderShopResolver],
  },
})
export class PreOrderInquiryPlugin {
  static options: PluginInitOptions;

  static init(options: PluginInitOptions = {} as any): typeof PreOrderInquiryPlugin {
    this.options = options;
    return PreOrderInquiryPlugin;
  }
}
