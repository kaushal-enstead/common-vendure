import { Collection, TransactionalConnection } from '@vendure/core';
import { In } from 'typeorm';
import { parseJson } from '../../../utils/helper';
import { ProductCategoryRow, ProductRow } from '../types';
import { buildVariantRows } from '../variant-utils';

type CollectionLinkRow = {
  collectionId: string;
  productVariantId: string;
};

type ParsedCategoryIds = {
  hasValue: boolean;
  ids: string[];
};

function parseCategoryIds(value: ProductRow['categories_id_json'] | null | undefined): ParsedCategoryIds {
  if (value == null || value === '') {
    return { hasValue: false, ids: [] };
  }

  const parsed = parseJson<{ mba_categories?: ProductCategoryRow[] } | ProductCategoryRow[]>(value);
  if (!parsed) {
    return { hasValue: false, ids: [] };
  }

  const categories = Array.isArray(parsed) ? parsed : parsed.mba_categories;
  if (!Array.isArray(categories)) {
    return { hasValue: false, ids: [] };
  }

  return {
    hasValue: true,
    ids: [...new Set(categories.map(category => String(category.id)).filter(Boolean))],
  };
}

function buildCompositeWhere(links: CollectionLinkRow[]): { clause: string; params: Record<string, string> } {
  const params: Record<string, string> = {};
  const clause = links
    .map((link, index) => {
      params[`collectionId${index}`] = link.collectionId;
      params[`productVariantId${index}`] = link.productVariantId;
      return `(collectionId = :collectionId${index} AND productVariantId = :productVariantId${index})`;
    })
    .join(' OR ');

  return { clause, params };
}

export async function syncVariantCollections(
  connection: TransactionalConnection,
  rows: ProductRow[],
): Promise<boolean> {
  const variantRows = buildVariantRows(rows);
  if (variantRows.length === 0) {
    return false;
  }

  const variantIds = [...new Set(variantRows.map(row => row.variantId))];
  const desiredCollectionIdsByVariant = new Map<string, string[]>();
  const requestedCollectionIds = new Set<string>();

  for (const variantRow of variantRows) {
    const variantCategories = parseCategoryIds(variantRow.variant.categories_id_json);
    const parentCategories = parseCategoryIds(variantRow.parent.categories_id_json);
    const collectionIds = variantCategories.hasValue ? variantCategories.ids : parentCategories.ids;

    desiredCollectionIdsByVariant.set(variantRow.variantId, collectionIds);
    for (const collectionId of collectionIds) {
      requestedCollectionIds.add(collectionId);
    }
  }

  const collectionRepo = connection.rawConnection.getRepository(Collection);
  const existingCollections =
    requestedCollectionIds.size > 0
      ? await collectionRepo.find({
          select: { id: true },
          where: { id: In([...requestedCollectionIds]) },
        })
      : [];
  const validCollectionIds = new Set(existingCollections.map(collection => String(collection.id)));

  const desiredLinks: CollectionLinkRow[] = [];
  const desiredLinkKeys = new Set<string>();

  for (const [variantId, collectionIds] of desiredCollectionIdsByVariant.entries()) {
    for (const collectionId of collectionIds) {
      if (!validCollectionIds.has(collectionId)) {
        continue;
      }
      const key = `${collectionId}::${variantId}`;
      if (desiredLinkKeys.has(key)) {
        continue;
      }
      desiredLinkKeys.add(key);
      desiredLinks.push({ collectionId, productVariantId: variantId });
    }
  }

  const existingLinks = await connection.rawConnection
    .createQueryBuilder()
    .select('link.collectionId', 'collectionId')
    .addSelect('link.productVariantId', 'productVariantId')
    .from('collection_product_variants_product_variant', 'link')
    .where('link.productVariantId IN (:...variantIds)', { variantIds })
    .getRawMany<CollectionLinkRow>();
  const existingLinkKeys = new Set(
    existingLinks.map(link => `${link.collectionId}::${link.productVariantId}`),
  );

  const linksToInsert = desiredLinks.filter(
    link => !existingLinkKeys.has(`${link.collectionId}::${link.productVariantId}`),
  );
  const linksToDelete = existingLinks.filter(
    link => !desiredLinkKeys.has(`${link.collectionId}::${link.productVariantId}`),
  );

  if (linksToDelete.length > 0) {
    const { clause, params } = buildCompositeWhere(linksToDelete);
    await connection.rawConnection
      .createQueryBuilder()
      .delete()
      .from('collection_product_variants_product_variant')
      .where(clause, params)
      .execute();
  }

  if (linksToInsert.length > 0) {
    await connection.rawConnection
      .createQueryBuilder()
      .insert()
      .into('collection_product_variants_product_variant')
      .values(linksToInsert)
      .orIgnore()
      .execute();
  }

  return linksToInsert.length > 0 || linksToDelete.length > 0;
}
