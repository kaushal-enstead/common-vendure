import { ConfigurableOperation } from '@vendure/common/lib/generated-types';
import { Collection, TransactionalConnection } from '@vendure/core';
import { In } from 'typeorm';
import { parseJson } from '../../utils/helper';
import { ProductCategoryRow, ProductRow } from './types';
import { buildVariantRows } from './variant-utils';

const PRODUCT_ID_FILTER = 'product-id-filter';
const VARIANT_ID_FILTER = 'variant-id-filter';

type ParsedCategoryIds = {
  hasValue: boolean;
  ids: string[];
};

type CollectionMembershipState = {
  productIds: Set<string>;
  variantIds: Set<string>;
};

type CollectionLinkRow = {
  collectionId: string;
  productVariantId: string;
};

type ConfigArgLike = {
  name: string;
  value: string;
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

function getOrCreateMembership(
  collectionMemberships: Map<string, CollectionMembershipState>,
  collectionId: string,
): CollectionMembershipState {
  let membership = collectionMemberships.get(collectionId);
  if (!membership) {
    membership = { productIds: new Set<string>(), variantIds: new Set<string>() };
    collectionMemberships.set(collectionId, membership);
  }
  return membership;
}

function normalizeIds(ids: Iterable<string>): string[] {
  return [...new Set([...ids].map(String).filter(Boolean))].sort();
}

function readArgValue(filter: ConfigurableOperation, argName: string): string | undefined {
  const args = Array.isArray(filter.args) ? (filter.args as ConfigArgLike[]) : [];
  return args.find(arg => arg.name === argName)?.value;
}

function readIdsFromFilter(filter: ConfigurableOperation, argName: string): string[] {
  const rawValue = readArgValue(filter, argName);
  if (!rawValue) {
    return [];
  }

  const parsed = parseJson<string[]>(rawValue);
  return Array.isArray(parsed) ? normalizeIds(parsed) : [];
}

function buildIdFilter(code: string, argName: string, ids: string[]): ConfigurableOperation {
  return {
    code,
    args: [
      { name: argName, value: JSON.stringify(ids) },
      { name: 'combineWithAnd', value: 'true' },
    ],
  };
}

function filtersEqual(a: ConfigurableOperation[], b: ConfigurableOperation[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export async function syncCollectionFilters(
  connection: TransactionalConnection,
  rows: ProductRow[],
): Promise<string[]> {
  const variantRows = buildVariantRows(rows);
  if (variantRows.length === 0) {
    return [];
  }

  const batchProductIds = new Set(rows.map(row => row.id.toString()));
  const batchVariantIds = new Set(variantRows.map(row => row.variantId));
  const desiredMemberships = new Map<string, CollectionMembershipState>();

  for (const row of rows) {
    const productCategories = parseCategoryIds(row.categories_id_json);
    for (const collectionId of productCategories.ids) {
      getOrCreateMembership(desiredMemberships, collectionId).productIds.add(row.id.toString());
    }
  }

  for (const variantRow of variantRows) {
    const variantCategories = parseCategoryIds(variantRow.variant.categories_id_json);
    if (!variantCategories.hasValue) {
      continue;
    }
    for (const collectionId of variantCategories.ids) {
      getOrCreateMembership(desiredMemberships, collectionId).variantIds.add(variantRow.variantId);
    }
  }

  const variantIds = [...batchVariantIds];
  const existingLinks = await connection.rawConnection
    .createQueryBuilder()
    .select('link.collectionId', 'collectionId')
    .addSelect('link.productVariantId', 'productVariantId')
    .from('collection_product_variants_product_variant', 'link')
    .where('link.productVariantId IN (:...variantIds)', { variantIds })
    .getRawMany<CollectionLinkRow>();

  const touchedCollectionIds = new Set<string>([
    ...desiredMemberships.keys(),
    ...existingLinks.map(link => String(link.collectionId)),
  ]);

  if (touchedCollectionIds.size === 0) {
    return [];
  }

  const collectionRepo = connection.rawConnection.getRepository(Collection);
  const collections = await collectionRepo.find({
    where: { id: In([...touchedCollectionIds]) },
  });

  const changedCollections: Collection[] = [];
  const changedCollectionIds: string[] = [];

  for (const collection of collections) {
    const collectionId = String(collection.id);
    const desired = desiredMemberships.get(collectionId) ?? {
      productIds: new Set<string>(),
      variantIds: new Set<string>(),
    };
    const currentFilters = Array.isArray(collection.filters) ? collection.filters : [];
    const preservedFilters = currentFilters.filter(
      filter => filter.code !== PRODUCT_ID_FILTER && filter.code !== VARIANT_ID_FILTER,
    );

    const existingProductFilter = currentFilters.find(filter => filter.code === PRODUCT_ID_FILTER);
    const existingVariantFilter = currentFilters.find(filter => filter.code === VARIANT_ID_FILTER);
    const mergedProductIds = new Set(
      readIdsFromFilter(existingProductFilter ?? { code: '', args: [] }, 'productIds'),
    );
    const mergedVariantIds = new Set(
      readIdsFromFilter(existingVariantFilter ?? { code: '', args: [] }, 'variantIds'),
    );

    for (const productId of batchProductIds) {
      mergedProductIds.delete(productId);
    }
    for (const variantId of batchVariantIds) {
      mergedVariantIds.delete(variantId);
    }
    for (const productId of desired.productIds) {
      mergedProductIds.add(productId);
    }
    for (const variantId of desired.variantIds) {
      mergedVariantIds.add(variantId);
    }

    const nextFilters = [...preservedFilters];
    const nextProductIds = normalizeIds(mergedProductIds);
    const nextVariantIds = normalizeIds(mergedVariantIds);

    if (nextProductIds.length > 0) {
      nextFilters.push(buildIdFilter(PRODUCT_ID_FILTER, 'productIds', nextProductIds));
    }
    // if (nextVariantIds.length > 0) {
    //   nextFilters.push(buildIdFilter(VARIANT_ID_FILTER, 'variantIds', nextVariantIds));
    // }

    if (!filtersEqual(currentFilters, nextFilters)) {
      collection.filters = nextFilters;
      changedCollections.push(collection);
      changedCollectionIds.push(collectionId);
    }
  }

  if (changedCollections.length > 0) {
    await collectionRepo.save(changedCollections);
  }

  return changedCollectionIds;
}
