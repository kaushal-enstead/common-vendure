import { TransactionalConnection } from '@vendure/core';
import { ProductRow } from '../types';
import { parseJson } from '../../../utils/helper';
import { variantOptionConfigs } from '../constants';

export async function linkGroupsToProducts(connection: TransactionalConnection, rows: ProductRow[]) {
  const links: { productId: string; productOptionGroupId: string }[] = [];
  const productIds = rows.map(row => row.id.toString());

  for (const row of rows) {
    const productId = row.id.toString();
    const variants = parseJson<ProductRow[]>(row.variants) ?? [];

    for (const config of variantOptionConfigs) {
      // Only link the group if this product actually has variants with this option
      const hasOption = variants.some(v => config.valueKeys.some(k => (v as any)[k]));
      if (!hasOption) continue;

      links.push({
        productId,
        productOptionGroupId: `og-${config.code}`,
      });
    }
  }

  if (!links.length) return;

  if (productIds.length) {
    await connection.rawConnection
      .createQueryBuilder()
      .delete()
      .from('product_option_groups_product_option_group')
      .where('productId IN (:...productIds)', { productIds })
      .execute();
  }

  await connection.rawConnection
    .createQueryBuilder()
    .insert()
    .into('product_option_groups_product_option_group')
    .values(links)
    .orIgnore()
    .execute();
}
