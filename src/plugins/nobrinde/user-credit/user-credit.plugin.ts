import {
  LanguageCode,
  PaymentMethod,
  PaymentMethodService,
  PluginCommonModule,
  RequestContextService,
  TransactionalConnection,
  Type,
  VendurePlugin,
} from '@vendure/core';
import { userCreditPaymentHandler } from './payment/user-credit-payment-handler';
import { userCreditPaymentChecker } from './payment/user-credit-payment-checker';
import { UserCreditService } from './services/user-credit.service';
import { UserCreditPaymentListener } from './listener/user-credit-payment.listener';
import { userCreditPaymentMethodCode } from './constants';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [UserCreditService, UserCreditPaymentListener],
  configuration: config => {
    // Add custom fields to Customer entity
    config.customFields.Customer.push(
      {
        name: 'credits',
        type: 'int',
        defaultValue: 0,
        label: [
          { languageCode: LanguageCode.en, value: 'Credits' },
          { languageCode: LanguageCode.pt, value: 'Créditos' },
        ],
        ui: {
          tab: 'User Credits',
        },
      },
      {
        name: 'credits_used',
        type: 'int',
        defaultValue: 0,
        label: [
          { languageCode: LanguageCode.en, value: 'Credits Used' },
          { languageCode: LanguageCode.pt, value: 'Créditos Usados' },
        ],
        ui: {
          tab: 'User Credits',
        },
      },
    );

    // Register payment method handler and checker
    config.paymentOptions.paymentMethodHandlers.push(userCreditPaymentHandler);
    if (config.paymentOptions.paymentMethodEligibilityCheckers) {
      config.paymentOptions.paymentMethodEligibilityCheckers.push(userCreditPaymentChecker);
    } else {
      config.paymentOptions.paymentMethodEligibilityCheckers = [userCreditPaymentChecker];
    }

    return config;
  },
  compatibility: '^3.0.0',
  dashboard: './dashboard/index.tsx',
})
export class UserCreditPlugin {
  constructor(
    private connection: TransactionalConnection,
    private requestContextService: RequestContextService,
    private paymentMethodService: PaymentMethodService,
  ) {}
  static init(): Type<UserCreditPlugin> {
    return UserCreditPlugin;
  }

  async onApplicationBootstrap() {
    await this.ensurePaymentMethodExists();
  }

  private async ensurePaymentMethodExists() {
    const paymentMethod = await this.connection.rawConnection.getRepository(PaymentMethod).findOne({
      where: { code: userCreditPaymentMethodCode },
    });
    if (!paymentMethod) {
      const ctx = await this.requestContextService.create({ apiType: 'admin' });
      await this.paymentMethodService.create(ctx, {
        code: userCreditPaymentMethodCode,
        checker: {
          code: userCreditPaymentChecker.code,
          arguments: [{ name: 'minOrderValue', value: '0' }],
        },
        handler: {
          code: userCreditPaymentHandler.code,
          arguments: [],
        },
        enabled: true,
        translations: [
          { languageCode: LanguageCode.en, name: 'User Credit' },
          { languageCode: LanguageCode.pt, name: 'Crédito do Usuário' },
        ],
      });
    }
  }
}
