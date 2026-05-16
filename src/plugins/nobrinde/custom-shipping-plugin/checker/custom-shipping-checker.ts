import {
  EntityHydrator,
  LanguageCode,
  ShippingEligibilityChecker,
  TransactionalConnection,
} from '@vendure/core';
import { CUSTOM_SHIPPING_QUOTE_STATUS_READY } from '../constants';
import { findZoneForCountry, getOrderWeightKg } from '../destination';

let hydrator: EntityHydrator;
let connection: TransactionalConnection;

export const customShippingChecker = new ShippingEligibilityChecker({
  code: 'custom-shipping-checker',
  description: [
    { languageCode: LanguageCode.en, value: 'Custom shipping eligibility checker' },
    { languageCode: LanguageCode.pt, value: 'Verificador de elegibilidade de envio personalizado' },
  ],
  args: {
    minWeightKg: {
      type: 'float',
      defaultValue: 0,
      suffix: 'kg',
      label: [{ languageCode: LanguageCode.en, value: 'Minimum order weight' }],
    },
    maxWeightKg: {
      type: 'float',
      defaultValue: 200,
      suffix: 'kg',
      label: [{ languageCode: LanguageCode.en, value: 'Maximum order weight' }],
    },
  },

  async init(injector) {
    hydrator = injector.get(EntityHydrator);
    connection = injector.get(TransactionalConnection);
  },

  async check(ctx, order, args) {
    if (!order.shippingAddress?.countryCode || !order.lines?.length) return false;

    await hydrator.hydrate(ctx, order, {
      relations: ['lines', 'lines.productVariant', 'lines.productVariant.product'],
    });

    const zone = await findZoneForCountry(
      ctx,
      order.shippingAddress.countryCode,
      order.shippingAddress.postalCode,
      connection,
    );
    if (!zone) return false;

    if (zone.customFields.quoteEnabled) {
      // Quote zone: only eligible once the admin has set a quote (status READY)
      const status = String(order.customFields?.customShippingQuoteStatus ?? '');
      return status === CUSTOM_SHIPPING_QUOTE_STATUS_READY;
    }

    // Standard zone: enforce weight bounds
    const totalWeightKg = getOrderWeightKg(order) || 20;
    return totalWeightKg >= args.minWeightKg && totalWeightKg <= args.maxWeightKg;
  },
});
