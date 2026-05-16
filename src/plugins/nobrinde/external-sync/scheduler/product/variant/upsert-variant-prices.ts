import { TransactionalConnection, Channel, Product, ProductVariant } from '@vendure/core';
import { In } from 'typeorm';
import { parseJson } from '../../../utils/helper';
import { PriceRow } from '../types';
import { syncVariantPrice } from './sync-variant-price';

export type VariantPriceByParentSkuRow = {
  parent_sku: string;
  min_qty: number | string | null;
  prices_json: string | null;
};

function normalizeMinQty(value: number | string | null | undefined): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.floor(n);
}

/**
 * Resolves Vendure products by `Product.customFields.main_sku` (DB: customFieldsMain_sku) and updates
 * every variant on those products: price tiers + list price + minQuantity.
 */
export async function upsertVariantPricesByParentSkuRows(
  connection: TransactionalConnection,
  defaultChannel: Channel | null,
  rows: VariantPriceByParentSkuRow[],
): Promise<{ appliedVariants: number; skippedSkus: number }> {
  if (!rows.length) {
    return { appliedVariants: 0, skippedSkus: 0 };
  }

  const bySku = new Map<string, VariantPriceByParentSkuRow>();
  for (const row of rows) {
    const sku = String(row.parent_sku ?? '').trim();
    if (!sku) continue;
    bySku.set(sku, row);
  }

  const skus = [...bySku.keys()];
  if (!skus.length) {
    return { appliedVariants: 0, skippedSkus: 0 };
  }

  const productRepo = connection.rawConnection.getRepository(Product);
  const products = await productRepo
    .createQueryBuilder('p')
    .select('p.id', 'id')
    .addSelect('p.customFieldsMain_sku', 'mainSku')
    .where('p.customFieldsMain_sku IN (:...skus)', { skus })
    .getRawMany<{ id: string; mainSku: string }>();

  const productIdsBySku = new Map<string, string[]>();
  for (const pr of products) {
    const key = String(pr.mainSku ?? '').trim();
    if (!key) continue;
    let list = productIdsBySku.get(key);
    if (!list) {
      list = [];
      productIdsBySku.set(key, list);
    }
    list.push(String(pr.id));
  }

  const allProductIds = [...new Set(products.map(p => String(p.id)))];
  if (!allProductIds.length) {
    return { appliedVariants: 0, skippedSkus: skus.length };
  }

  const variantRepo = connection.rawConnection.getRepository(ProductVariant);
  const allVariants = await variantRepo.find({
    where: { productId: In(allProductIds) },
    select: ['id', 'productId', 'customFields'],
  });

  const variantsByProductId = new Map<string, ProductVariant[]>();
  for (const v of allVariants) {
    const pid = String(v.productId);
    let list = variantsByProductId.get(pid);
    if (!list) {
      list = [];
      variantsByProductId.set(pid, list);
    }
    list.push(v);
  }

  const priceInputs: Array<{ quantityPriceTiers: PriceRow[]; variantId: string }> = [];
  const toSave: ProductVariant[] = [];
  let skippedSkus = 0;

  for (const sku of skus) {
    const row = bySku.get(sku)!;
    const productIds = productIdsBySku.get(sku) ?? [];
    if (!productIds.length) {
      skippedSkus++;
      continue;
    }

    const tiers = parseJson<PriceRow[]>(row.prices_json) ?? [];
    const mq = normalizeMinQty(row.min_qty);
    let variantCount = 0;

    for (const productId of productIds) {
      const variants = variantsByProductId.get(productId) ?? [];
      variantCount += variants.length;
      for (const v of variants) {
        priceInputs.push({ quantityPriceTiers: tiers, variantId: String(v.id) });
        const cf = (v.customFields ?? {}) as { minQuantity?: number };
        cf.minQuantity = mq;
        (v as { customFields: typeof cf }).customFields = cf;
        toSave.push(v);
      }
    }

    if (variantCount === 0) {
      skippedSkus++;
    }
  }

  if (priceInputs.length) {
    await syncVariantPrice(connection, defaultChannel, priceInputs);
  }
  if (toSave.length) {
    await variantRepo.save(toSave);
  }

  return { appliedVariants: priceInputs.length, skippedSkus };
}
