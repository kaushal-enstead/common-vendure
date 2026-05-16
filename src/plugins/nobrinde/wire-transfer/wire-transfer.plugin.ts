import {
  PaymentMethod,
  RequestContextService,
  PaymentMethodService,
  TransactionalConnection,
  Type,
  VendurePlugin,
  LanguageCode,
  PluginCommonModule,
} from '@vendure/core';
import { wireTransferPaymentHandler } from './payment/wire-transfer-payment.handler';
import { wireTransferPaymentChecker } from './payment/wire-transfer-payment.checker';
import { PluginInitOptions } from './types';
import { WIRE_TRANSFER_PLUGIN_OPTIONS, wireTransferPaymentMethodCode } from './constants';

@VendurePlugin({
  imports: [PluginCommonModule],
  compatibility: '^3.0.0',
  providers: [{ provide: WIRE_TRANSFER_PLUGIN_OPTIONS, useFactory: () => WireTransferPlugin.options }],
  configuration: config => {
    config.paymentOptions.paymentMethodHandlers.push(wireTransferPaymentHandler);
    if (config.paymentOptions?.paymentMethodEligibilityCheckers) {
      config.paymentOptions.paymentMethodEligibilityCheckers.push(wireTransferPaymentChecker);
    } else {
      config.paymentOptions.paymentMethodEligibilityCheckers = [wireTransferPaymentChecker];
    }
    return config;
  },
})
export class WireTransferPlugin {
  static options: PluginInitOptions;

  constructor(
    private connection: TransactionalConnection,
    private requestContextService: RequestContextService,
    private paymentMethodService: PaymentMethodService,
  ) {}

  static init(options: PluginInitOptions): Type<WireTransferPlugin> {
    this.options = options;
    return WireTransferPlugin;
  }

  async onApplicationBootstrap() {
    await this.ensurePaymentMethodExists();
  }

  private async ensurePaymentMethodExists() {
    const paymentMethod = await this.connection.rawConnection.getRepository(PaymentMethod).findOne({
      where: { code: wireTransferPaymentMethodCode },
    });
    // create the payment method if it doesn't exist
    if (!paymentMethod) {
      const ctx = await this.requestContextService.create({ apiType: 'admin' });
      await this.paymentMethodService.create(ctx, {
        code: wireTransferPaymentMethodCode,
        checker: {
          code: wireTransferPaymentChecker.code,
          arguments: [{ name: 'minOrderValue', value: '20' }],
        },
        handler: {
          code: wireTransferPaymentHandler.code,
          arguments: [{ name: 'automaticSettle', value: 'false' }],
        },
        enabled: true,
        translations: [
          { languageCode: LanguageCode.en, name: 'Wire Transfer' },
          { languageCode: LanguageCode.pt, name: 'Transferência Bancária' },
        ],
      });
    }
  }
}
