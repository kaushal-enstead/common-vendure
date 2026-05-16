import {
  OrderItemPriceCalculationStrategy,
  PriceCalculationResult,
  ProductVariant,
  RequestContext,
} from '@vendure/core';
import type { QuantityPriceTier } from './types';

/**
 * Finds the applicable tier for a given quantity.
 * Tiers are checked in order; first matching range wins.
 * quantityStart and quantityEnd are inclusive.
 */
export function getTierPriceForQuantity(
  tiers: QuantityPriceTier[] | null | undefined,
  quantity: number,
): number | null {
  if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
    return null;
  }
  const tier = tiers.find(
    t => quantity >= (t.quantityStart ?? 0) && quantity <= (t.quantityEnd ?? Number.MAX_SAFE_INTEGER),
  );
  return tier != null ? tier.price : null;
}

/**
 * OrderItemPriceCalculationStrategy that applies quantity-based tier pricing.
 * When a variant has customFields.quantityPriceTiers, the unit price is taken from
 * the tier whose range contains the order line quantity; otherwise the default
 * variant price is used.
 */
export class QuantityPriceCalculationStrategy implements OrderItemPriceCalculationStrategy {
  calculateUnitPrice(
    ctx: RequestContext,
    productVariant: ProductVariant,
    _orderLineCustomFields: { [key: string]: any },
    _order: any,
    quantity: number,
  ): PriceCalculationResult | Promise<PriceCalculationResult> {
    const currentVariantPrice = productVariant.productVariantPrices?.find(p => p.channelId === ctx.channelId);
    const tiers = currentVariantPrice?.customFields?.quantityPriceTiers;
    const tierPrice = getTierPriceForQuantity(tiers, quantity);

    if (tierPrice != null) {
      return {
        price: tierPrice,
        priceIncludesTax: productVariant.listPriceIncludesTax,
      };
    }

    return {
      price: productVariant.listPrice,
      priceIncludesTax: productVariant.listPriceIncludesTax,
    };
  }
}
