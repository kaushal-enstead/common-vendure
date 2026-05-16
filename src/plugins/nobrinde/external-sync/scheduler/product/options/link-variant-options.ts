import { TransactionalConnection } from '@vendure/core';
import { ProductRow } from '../types';
import { variantOptionConfigs } from '../constants';
import { parseJson, slugify } from '../../../utils/helper';
import { getVariantId } from '../variant-utils';

export async function linkVariantOptions(connection: TransactionalConnection, rows: ProductRow[]) {
  const variantLinks: { productVariantId: string; productOptionId: string }[] = [];
  const variantIds = rows.flatMap(row => {
    const variants = parseJson<ProductRow[]>(row.variants) ?? [];
    return variants.map(v => getVariantId(v));
  });
  for (const row of rows) {
    const variants = parseJson<ProductRow[]>(row.variants) ?? [];

    for (const config of variantOptionConfigs) {
      for (const v of variants) {
        const variantId = getVariantId(v);

        const value = config.valueKeys.map(k => (v as any)[k]).find(val => val);
        if (!value) continue;

        const code = slugify(value);
        const optionId = `opt-${config.code}-${code}`; // same shared ID

        variantLinks.push({ productVariantId: variantId, productOptionId: optionId });
      }
    }
  }

  if (!variantLinks.length) return;
  if (variantIds.length) {
    await connection.rawConnection
      .createQueryBuilder()
      .delete()
      .from('product_variant_options_product_option')
      .where('productVariantId IN (:...variantIds)', { variantIds })
      .execute();
  }

  await connection.rawConnection
    .createQueryBuilder()
    .insert()
    .into('product_variant_options_product_option')
    .values(variantLinks)
    .orIgnore()
    .execute();
}
