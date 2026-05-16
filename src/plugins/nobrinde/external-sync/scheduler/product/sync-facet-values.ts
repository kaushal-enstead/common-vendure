import { FacetValue, TransactionalConnection } from '@vendure/core';
import { In } from 'typeorm';
import { parseJson } from '../../utils/helper';
import { ProductRow, ProductTagRow } from './types';
import { buildVariantRows } from './variant-utils';

type ParsedTagValueIds = {
  hasValue: boolean;
  ids: string[];
};

type ProductFacetLinkRow = {
  productId: string;
  facetValueId: string;
};

type VariantFacetLinkRow = {
  productVariantId: string;
  facetValueId: string;
};

type SyncFacetValuesOptions = {
  includeProducts?: boolean;
  includeVariants?: boolean;
};

function normalizeIds(ids: Iterable<string>): string[] {
  return [...new Set([...ids].map(String).filter(Boolean))].sort();
}

function parseTagValueIds(value: ProductRow['tags_id_json'] | null | undefined): ParsedTagValueIds {
  if (value == null || value === '') {
    return { hasValue: false, ids: [] };
  }

  const parsed = parseJson<{ tags?: ProductTagRow[] } | ProductTagRow[]>(value);
  if (!parsed) {
    return { hasValue: false, ids: [] };
  }

  const tags = Array.isArray(parsed) ? parsed : parsed.tags;
  if (!Array.isArray(tags)) {
    return { hasValue: false, ids: [] };
  }

  const ids = normalizeIds(tags.map(tag => String(tag?.tag_value_id ?? '')));
  return { hasValue: ids.length > 0, ids };
}

export async function syncFacetValues(
  connection: TransactionalConnection,
  rows: ProductRow[],
  options: SyncFacetValuesOptions = {},
): Promise<boolean> {
  if (rows.length === 0) {
    return false;
  }
  const includeProducts = options.includeProducts ?? true;
  const includeVariants = options.includeVariants ?? true;
  if (!includeProducts && !includeVariants) {
    return false;
  }

  const variantRows = buildVariantRows(rows);
  const productIds = includeProducts ? normalizeIds(rows.map(row => row.id.toString())) : [];
  const variantIds = includeVariants ? normalizeIds(variantRows.map(row => row.variantId)) : [];

  const requestedFacetValueIds = new Set<string>();
  const desiredProductLinksByKey = new Map<string, ProductFacetLinkRow>();
  const desiredVariantLinksByKey = new Map<string, VariantFacetLinkRow>();

  if (includeProducts) {
    for (const row of rows) {
      const productTagValueIds = parseTagValueIds(row.tags_id_json).ids;
      for (const facetValueId of productTagValueIds) {
        requestedFacetValueIds.add(facetValueId);
        desiredProductLinksByKey.set(`${row.id}::${facetValueId}`, {
          productId: row.id.toString(),
          facetValueId,
        });
      }
    }
  }

  if (includeVariants) {
    for (const variantRow of variantRows) {
      const variantTags = parseTagValueIds(variantRow.variant.tags_id_json);
      const parentTags = parseTagValueIds(variantRow.parent.tags_id_json);
      const tagValueIds = variantTags.hasValue ? variantTags.ids : parentTags.ids;

      for (const facetValueId of tagValueIds) {
        requestedFacetValueIds.add(facetValueId);
        desiredVariantLinksByKey.set(`${variantRow.variantId}::${facetValueId}`, {
          productVariantId: variantRow.variantId,
          facetValueId,
        });
      }
    }
  }

  const facetValueRepo = connection.rawConnection.getRepository(FacetValue);
  const existingFacetValues =
    requestedFacetValueIds.size > 0
      ? await facetValueRepo.find({
          select: { id: true },
          where: { id: In([...requestedFacetValueIds]) },
        })
      : [];
  const validFacetValueIds = new Set(existingFacetValues.map(value => String(value.id)));

  const desiredProductLinks = [...desiredProductLinksByKey.values()].filter(link =>
    validFacetValueIds.has(link.facetValueId),
  );
  const desiredVariantLinks = [...desiredVariantLinksByKey.values()].filter(link =>
    validFacetValueIds.has(link.facetValueId),
  );

  if (productIds.length > 0) {
    await connection.rawConnection
      .createQueryBuilder()
      .delete()
      .from('product_facet_values_facet_value')
      .where('productId IN (:...productIds)', { productIds })
      .execute();
  }

  if (variantIds.length > 0) {
    await connection.rawConnection
      .createQueryBuilder()
      .delete()
      .from('product_variant_facet_values_facet_value')
      .where('productVariantId IN (:...variantIds)', { variantIds })
      .execute();
  }

  if (desiredProductLinks.length > 0) {
    await connection.rawConnection
      .createQueryBuilder()
      .insert()
      .into('product_facet_values_facet_value')
      .values(desiredProductLinks)
      .orIgnore()
      .execute();
  }

  if (desiredVariantLinks.length > 0) {
    await connection.rawConnection
      .createQueryBuilder()
      .insert()
      .into('product_variant_facet_values_facet_value')
      .values(desiredVariantLinks)
      .orIgnore()
      .execute();
  }

  return productIds.length > 0 || variantIds.length > 0;
}
