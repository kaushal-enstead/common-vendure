import {
  Injector,
  LanguageCode,
  Order,
  RequestContext,
  ShippingCalculator,
  TransactionalConnection,
} from '@vendure/core';
import { CUSTOM_SHIPPING_QUOTE_STATUS_READY } from '../constants';
import { getOrderWeightKg, resolveShippingZone } from '../destination';
import { DEFAULT_ZONE_RATES, parseZoneRates } from '../types';

let connection: TransactionalConnection;

const getQuoteCents = (order: Order): number => {
  const fields = (order.customFields ?? {}) as Record<string, unknown>;
  if (String(fields.customShippingQuoteStatus ?? '') !== CUSTOM_SHIPPING_QUOTE_STATUS_READY) return 0;
  const amount = Number(fields.customShippingQuoteAmount ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

export const customShippingCalculator = new ShippingCalculator({
  code: 'custom-shipping-calculator',
  description: [
    { languageCode: LanguageCode.en, value: 'Custom shipping — zone rates configured per shipping method' },
    { languageCode: LanguageCode.pt, value: 'Envio personalizado — preços por zona configurados no método de envio' },
  ],

  args: {
    zoneRates: {
      type: 'string',
      defaultValue: JSON.stringify(DEFAULT_ZONE_RATES, null, 2),
      label: [{ languageCode: LanguageCode.en, value: 'Zone rates' }],
      description: [
        {
          languageCode: LanguageCode.en,
          value:
            'One row per zone: zoneName, pricePerKgEUR, freeShipping, minAmountEUR, quoteEnabled. ' +
            'Each zoneName must match a Zone name in Vendure exactly.',
        },
      ],
      ui: { component: 'custom-shipping-zone-rates-editor' },
    },
  },

  init(injector: Injector) {
    connection = injector.get(TransactionalConnection);
  },

  calculate: async (ctx: RequestContext, order: Order, args) => {
    if (!order.lines.length) {
      return { price: 0, priceWithTax: 0, priceIncludesTax: true, taxRate: 0 };
    }

    const zoneRates = parseZoneRates(args.zoneRates);
    const zone = await resolveShippingZone(ctx, order, connection, zoneRates.map(r => r.zoneName));
    if (!zone) return { price: 0, priceWithTax: 0, priceIncludesTax: true, taxRate: 0 };

    const rateEntry = zoneRates.find(r => r.zoneName === zone.name);
    if (!rateEntry) return { price: 0, priceWithTax: 0, priceIncludesTax: true, taxRate: 0 };

    // Quote zone: return the admin-set price if ready, otherwise 0
    if (zone.customFields.quoteEnabled) {
      const price = getQuoteCents(order);
      return { price, priceWithTax: price, priceIncludesTax: true, taxRate: 0 };
    }

    // Free shipping threshold
    if (rateEntry.freeShipping) {
      const minCents = Math.max(0, Math.round(rateEntry.minAmountEUR));
      if (order.subTotalWithTax >= minCents) {
        return { price: 0, priceWithTax: 0, priceIncludesTax: true, taxRate: 0 };
      }
    }

    // Weight × rate
    const weightKg = getOrderWeightKg(order) || 20;
    const price = Math.max(0, Math.round(weightKg * rateEntry.pricePerKgEUR));
    return { price, priceWithTax: price, priceIncludesTax: true, taxRate: 0 };
  },
});
