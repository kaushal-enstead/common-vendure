import { Asset, LanguageCode, PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { adminApiExtensions } from './api/admin-api-extensions';
import { QrCodeResolver } from './api/qr-code.resolver';
import { QrCodeService } from './services/qr-code.service';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [QrCodeService, QrCodeResolver],
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [QrCodeResolver],
  },
  configuration: config => {
    config.customFields.Product.push({
      name: 'qrCodeAsset',
      type: 'relation',
      entity: Asset,
      nullable: true,
      public: true,
      label: [
        { languageCode: LanguageCode.en, value: 'QR Code Asset' },
        { languageCode: LanguageCode.pt, value: 'Asset de QR Code' },
      ],
      ui: { tab: 'Media' },
    });

    config.customFields.ProductVariant.push({
      name: 'qrCodeAsset',
      type: 'relation',
      entity: Asset,
      nullable: true,
      public: true,
      label: [
        { languageCode: LanguageCode.en, value: 'QR Code Asset' },
        { languageCode: LanguageCode.pt, value: 'Asset de QR Code' },
      ],
      ui: { tab: 'Media' },
    });

    return config;
  },
  compatibility: '^3.0.0',
  dashboard: './dashboard/index.tsx',
})
export class QrCodePlugin {
  static init(): Type<QrCodePlugin> {
    return QrCodePlugin;
  }
}
