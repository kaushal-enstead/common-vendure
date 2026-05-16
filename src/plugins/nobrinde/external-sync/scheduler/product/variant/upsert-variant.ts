import {
  TransactionalConnection,
  TaxCategory,
  Channel,
  ProductVariant,
  ProductVariantTranslation,
} from '@vendure/core';
import { SyncResult } from '../../../types';
import { LanguageRow, ProductRow } from '../types';
import { In } from 'typeorm';
import { assignChannels } from '../assign-channel';
import { upsertAssets } from '../upsert-asset';
import { syncVariantPrice } from './sync-variant-price';
import { buildVariantRows } from '../variant-utils';

export type UpsertVariantsOptions = {
  /** When false, skip ProductVariantPrice upsert (e.g. dedicated price sync task). Default true. */
  syncPrices?: boolean;
};

export async function upsertVariants(
  connection: TransactionalConnection,
  taxCategory: TaxCategory,
  defaultChannel: Channel | null,
  rows: ProductRow[],
  languageCodes: (keyof LanguageRow)[],
  resultObject: SyncResult,
  options: UpsertVariantsOptions = {},
) {
  const syncPrices = options.syncPrices !== false;
  const productVariantRepo = connection.rawConnection.getRepository(ProductVariant);
  const productVariantTranslationRepo = connection.rawConnection.getRepository(ProductVariantTranslation);
  const variantRows = buildVariantRows(rows);

  if (variantRows.length === 0) {
    return;
  }

  resultObject.totalRows += variantRows.length;
  const variantsToUpsert = variantRows.map(({ parentId, variant, variantId }) => {
    // const enabled = !!variant.is_active && !!variant.is_visible && !variant.is_discontinued;
    // const deletedAt =
    //   variant.is_discontinued && variant.date_discontinued ? new Date(variant.date_discontinued) : null;
    return new ProductVariant({
      id: variantId,
      sku: variant.sku_variant || variant.sku,
      enabled: !!variant.is_active,
      deletedAt: null,
      product: { id: parentId },
      productId: parentId,
      taxCategoryId: taxCategory.id,
      customFields: {
        minQuantity: variant.min_quantity ?? 1,
        // quantityPriceTiers: variant.prices ?? [],
        item_code: variant.itemcode,
        ean_code: variant.ean_code,
        barcode: variant.barcode,
        hs_code: variant.hs_code,
        intrastat_code: variant.intrastat_code,
        is_new: variant.is_new,
        is_best_seller: variant.is_best_seller,
        is_stockoff: variant.is_stockoff,
        date_release: variant.date_release ? new Date(variant.date_release) : null,
        date_new_end: variant.date_new_end ? new Date(variant.date_new_end) : null,
        is_promotion: variant.is_promotion,
        promotion_value: variant.promotion_value,
        promotion_percentage: variant.promotion_percentage,
        promotion_date_start: variant.promotion_date_start ? new Date(variant.promotion_date_start) : null,
        promotion_date_end: variant.promotion_date_end ? new Date(variant.promotion_date_end) : null,
        is_featured: variant.is_featured,
        date_featured_start: variant.date_featured_start ? new Date(variant.date_featured_start) : null,
        date_featured_end: variant.date_featured_end ? new Date(variant.date_featured_end) : null,
        is_discontinued: variant.is_discontinued,
        date_discontinued: variant.date_discontinued ? new Date(variant.date_discontinued) : null,
      },
    } as any);
  });

  await productVariantRepo.upsert(variantsToUpsert, ['id']);

  // Product variant translations
  const variantIds = variantsToUpsert.map(v => v.id!.toString());
  await productVariantTranslationRepo.delete({ base: { id: In(variantIds) } });
  const variantTranslations = variantRows.flatMap(({ name: parentName, variant, variantId }) =>
    languageCodes.map(languageCode => {
      const code = languageCode as string;
      const name =
        (variant[`name_${code}` as keyof ProductRow] as string) ||
        (variant.name_en as string) ||
        parentName ||
        variant.sku_variant;
      return new ProductVariantTranslation({
        languageCode,
        name,
        base: { id: variantId },
      } as any);
    }),
  );
  if (variantTranslations.length > 0) {
    await productVariantTranslationRepo.insert(variantTranslations);
  }

  // Product assets
  // console.time('upsertVariantAssets');
  await upsertAssets(
    connection,
    defaultChannel,
    variantRows.map(r => ({ ...r.variant, id: r.variantId })),
    'variant',
    variantIds,
    languageCodes,
  );
  // console.timeEnd('upsertVariantAssets');

  // Product variant channels
  await assignChannels(connection, defaultChannel, 'variant', variantIds);

  if (syncPrices) {
    await syncVariantPrice(
      connection,
      defaultChannel,
      variantRows.map(r => ({
        quantityPriceTiers: r.variant.prices,
        variantId: r.variantId,
      })),
    );
  }

  if (resultObject.upsertedRows) {
    resultObject.upsertedRows += variantsToUpsert.length;
  } else {
    resultObject.upsertedRows = variantsToUpsert.length;
  }
}
