import { TransactionalConnection, Channel, ProductVariantPrice, CurrencyCode } from '@vendure/core';
import { PriceRow } from '../types';

export async function syncVariantPrice(
  connection: TransactionalConnection,
  defaultChannel: Channel | null,
  rows: Array<{ quantityPriceTiers: PriceRow[]; variantId: string }>,
) {
  const productVariantPriceRepo = connection.rawConnection.getRepository(ProductVariantPrice);
  await productVariantPriceRepo.upsert(
    rows.map(
      entity =>
        new ProductVariantPrice({
          id: `pr-${entity.variantId}`,
          channelId: defaultChannel?.id,
          variant: { id: entity.variantId },
          price: entity.quantityPriceTiers?.[0]?.price ?? 0,
          currencyCode: defaultChannel?.defaultCurrencyCode ?? CurrencyCode.USD,
          customFields: {
            quantityPriceTiers: entity.quantityPriceTiers ?? [],
          },
        }),
    ),
    ['id'],
  );
}
