import { parseJson } from '../../utils/helper';
import { ProductRow } from './types';

/**
 * Flat simple-product rows have no `variants` JSON. Vendure still needs one ProductVariant per product;
 * mirror the previous SQL shape: a single variant object with parent fields and safe defaults.
 */
export function normalizeSimpleProductRows(rows: ProductRow[]): ProductRow[] {
  return rows.map(row => {
    const parsed = parseJson<ProductRow[]>(row.variants);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return row;
    }
    const { variants: _drop, ...rest } = row as ProductRow & { variants?: unknown };
    const skuVariant = row.sku_variant || row.sku;
    const variant: ProductRow = {
      ...(rest as ProductRow),
      sku_variant: skuVariant,
      prices: Array.isArray(row.prices) ? row.prices : [],
      min_quantity: row.min_quantity ?? 1,
    };
    return {
      ...row,
      variants: JSON.stringify([variant]),
    } as unknown as ProductRow;
  });
}

export type SyncedVariantRow = {
  name: string;
  parentId: string;
  parent: ProductRow;
  variant: ProductRow;
  variantId: string;
};

export function getVariantId(variant: Pick<ProductRow, 'id' | 'sku' | 'sku_variant'>): string {
  // return `var-${variant.id}-${variant.sku_variant || variant.sku}`;
  return `var-${variant.id}`;
}

/** Inverse of {@link getVariantId}. Returns the external numeric ID, or null if unparseable. */
export function parseVariantId(vendureId: string): number | null {
  const match = /^var-(\d+)/.exec(vendureId);
  if (match) return parseInt(match[1], 10);
  const numeric = parseInt(vendureId, 10);
  return Number.isNaN(numeric) ? null : numeric;
}

export function buildVariantRows(rows: ProductRow[]): SyncedVariantRow[] {
  const seenSkuVariants = new Set<string>();
  const variantRows: SyncedVariantRow[] = [];

  for (const row of rows) {
    // Skip this row if its sku_variant has already been seen
    const skuVariantKey = row.sku_variant || row.sku;
    if (skuVariantKey && seenSkuVariants.has(skuVariantKey)) {
      continue;
    }
    if (skuVariantKey) {
      seenSkuVariants.add(skuVariantKey);
    }

    const parsedVariants = parseJson<ProductRow[]>(row.variants);
    if (Array.isArray(parsedVariants) && parsedVariants.length > 0) {
      for (const variant of parsedVariants) {
        variantRows.push({
          name: row.name_en,
          parentId: row.id.toString(),
          parent: row,
          variant,
          variantId: getVariantId(variant),
        });
      }
    }
  }

  return variantRows;
}

export function getUniqueSkus(rows: ProductRow[]): ProductRow[] {
  const seen = new Set<string>();

  return rows.filter(row => {
    if (!row.sku) return false; // or true depending on your logic

    if (seen.has(row.sku)) {
      return false;
    }

    seen.add(row.sku);
    return true;
  });
}
