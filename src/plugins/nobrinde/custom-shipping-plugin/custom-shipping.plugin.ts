import { LanguageCode, PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { OnApplicationBootstrap } from '@nestjs/common';

import { customShippingCalculator } from './calculator/custom-shipping-calculator';
import { customShippingChecker } from './checker/custom-shipping-checker';
import { customPaymentEligibilityChecker } from './checker/custom-payment-eligibility.checker';
import { customShippingFulfillmentHandler } from './handler/custom-shipping-handler';
import { CustomShippingAdminResolver } from './resolver/custom-shipping.admin.resolver';
import { CustomShippingShopResolver } from './resolver/custom-shipping.shop.resolver';
import { OrderAddressZoneResolver } from './api/order-address.resolver';
import { adminApiExtensions, shopApiExtensions } from './api/api-extensions';
import { customShippingQuoteReadyHandler } from './events/event-handler';
import { CustomShippingBootstrapService } from './services/custom-shipping-bootstrap.service';
import { CUSTOM_SHIPPING_QUOTE_STATUS_NOT_REQUIRED } from './constants';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [CustomShippingBootstrapService],
  compatibility: '^3.0.0',
  entities: [],
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [OrderAddressZoneResolver, CustomShippingShopResolver],
  },
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [CustomShippingAdminResolver, OrderAddressZoneResolver],
  },
  configuration: config => {
    // --- Shipping options ---
    config.shippingOptions.shippingCalculators.push(customShippingCalculator);
    config.shippingOptions.shippingEligibilityCheckers.push(customShippingChecker);
    config.shippingOptions.fulfillmentHandlers.push(customShippingFulfillmentHandler);

    // --- Zone custom fields (routing-only) ---
    // Pricing lives in the `zoneRates` JSON arg on each shipping method's
    // calculator/checker so every channel can have independent prices.
    // Pricing (pricePerKgEUR, freeShipping, minAmountEUR, requiresManualQuote) lives in
    // the `zoneRates` JSON arg on the shipping method's calculator/checker,
    // so each channel can have independent pricing without touching zone config.
    config.customFields.Zone = config.customFields.Zone ?? [];
    config.customFields.Zone.push(
      {
        name: 'shippingZonePriority',
        type: 'int',
        defaultValue: 0,
        label: [{ languageCode: LanguageCode.en, value: 'Zone priority (lower = matched first)' }],
        description: [
          {
            languageCode: LanguageCode.en,
            value:
              'When a country belongs to multiple zones the lowest priority number wins. Portugal Islands (0) must be lower than Portugal Mainland (1).',
          },
        ],
        ui: { tab: 'Shipping' },
      },
      {
        name: 'quoteEnabled',
        type: 'boolean',
        defaultValue: false,
        label: [{ languageCode: LanguageCode.en, value: 'Requires manual quote' }],
        description: [
          {
            languageCode: LanguageCode.en,
            value:
              'When enabled, customers cannot select a shipping method for this zone. An admin must set a shipping quote manually before the order can proceed.',
          },
        ],
        ui: { tab: 'Shipping' },
      },
    );

    // --- Order custom fields ---
    config.customFields.Order = config.customFields.Order ?? [];
    config.customFields.Product.push({
      name: 'weight',
      type: 'float',
      nullable: true,
      label: [
        { languageCode: LanguageCode.en, value: 'Weight (kg)' },
        { languageCode: LanguageCode.pt, value: 'Peso (kg)' },
      ],
    });
    config.customFields.ProductVariant.push({
      name: 'weight',
      type: 'float',
      nullable: true,
      label: [
        { languageCode: LanguageCode.en, value: 'Weight (kg)' },
        { languageCode: LanguageCode.pt, value: 'Peso (kg)' },
      ],
    });
    config.customFields.Order.push(
      {
        name: 'customShippingQuoteStatus',
        type: 'string',
        readonly: true,
        // internal: true,
        defaultValue: CUSTOM_SHIPPING_QUOTE_STATUS_NOT_REQUIRED,
        label: [
          { languageCode: LanguageCode.en, value: 'Shipping quote status' },
          { languageCode: LanguageCode.pt, value: 'Estado da cotação de envio' },
        ],
        ui: { tab: 'Shipping' },
      },
      {
        name: 'customShippingQuoteAmount',
        type: 'int',
        readonly: true,
        nullable: true,
        // internal: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Shipping quote amount (cents, with tax)' },
          { languageCode: LanguageCode.pt, value: 'Valor da cotação de envio (cêntimos, com IVA)' },
        ],
        ui: { tab: 'Shipping' },
      },
      {
        name: 'customShippingQuoteUpdatedAt',
        type: 'datetime',
        nullable: true,
        readonly: true,
        // internal: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Shipping quote last updated' },
          { languageCode: LanguageCode.pt, value: 'Última atualização da cotação de envio' },
        ],
        ui: { tab: 'Shipping' },
      },
      {
        name: 'customShippingDestination',
        type: 'string',
        readonly: true,
        // internal: true,
        // nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Resolved shipping zone name' },
          { languageCode: LanguageCode.pt, value: 'Nome da zona de envio resolvida' },
        ],
        ui: { tab: 'Shipping' },
      },
    );

    // --- Payment eligibility ---
    if (config.paymentOptions.paymentMethodEligibilityCheckers) {
      config.paymentOptions.paymentMethodEligibilityCheckers.push(customPaymentEligibilityChecker);
    } else {
      config.paymentOptions.paymentMethodEligibilityCheckers = [customPaymentEligibilityChecker];
    }

    return config;
  },
  dashboard: './dashboard/index.tsx',
})
export class CustomShippingPlugin implements OnApplicationBootstrap {
  /** Spread into EmailPlugin.init({ handlers: [...CustomShippingPlugin.emailHandlers] }) */
  static emailHandlers = [customShippingQuoteReadyHandler];

  constructor(private readonly bootstrapService: CustomShippingBootstrapService) {}

  static init(): Type<CustomShippingPlugin> {
    return CustomShippingPlugin;
  }

  async onApplicationBootstrap() {
    await this.bootstrapService.bootstrap();
  }
}
