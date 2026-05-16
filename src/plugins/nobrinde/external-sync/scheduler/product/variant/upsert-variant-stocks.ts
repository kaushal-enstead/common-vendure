import { RequestContext, StockMovementService, TransactionalConnection, ProductVariant } from '@vendure/core';
import { In } from 'typeorm';
import { normalizeStockQuantity } from './sync-variant-stock';

export type VstocksDataRow = {
  sku_variant: string | null;
  has_stock: boolean | number | string | null;
  stocks: number | string | null;
  next_stocks_1: number | null;
  next_date_1: string | Date | null;
  next_stocks_2: number | null;
  next_date_2: string | Date | null;
  next_stocks_3: number | null;
  next_date_3: string | Date | null;
};

/** Cursor / dedupe key: matches `buildVariantStockSyncSql` ordering on `sku_variant`. */
export function vstocksCursorKey(row: VstocksDataRow): string {
  return String(row.sku_variant ?? '').trim();
}

export function buildVariantStockSyncSql(pageSize: number): string {
  const keyExpr = `CAST(LTRIM(RTRIM(CAST(st.sku_variant AS NVARCHAR(512)))) AS NVARCHAR(512))`;
  return `
    SELECT TOP ${pageSize}
        st.sku_variant AS sku_variant,
        st.has_stock AS has_stock,
        st.stocks AS stocks,
        st.next_stocks_1 AS next_stocks_1,
        st.next_date_1   AS next_date_1,
        st.next_stocks_2 AS next_stocks_2,
        st.next_date_2   AS next_date_2,
        st.next_stocks_3 AS next_stocks_3,
        st.next_date_3   AS next_date_3
    FROM VSTOCKS_DATA st
    WHERE (${keyExpr} <> N'')
      AND (@p0 IS NULL OR ${keyExpr} > CAST(@p0 AS NVARCHAR(512)))
    ORDER BY ${keyExpr}
  `;
}

/**
 * Applies stock from `VSTOCKS_DATA` rows (no joins): each `sku_variant` matches `ProductVariant.sku`.
 */
export async function applyVstocksDataRows(
  ctx: RequestContext,
  connection: TransactionalConnection,
  stockMovementService: StockMovementService,
  rows: VstocksDataRow[],
): Promise<{ appliedVariants: number; skippedKeys: number }> {
  if (!rows.length) {
    return { appliedVariants: 0, skippedKeys: 0 };
  }

  const bySkuVariant = new Map<string, VstocksDataRow>();
  for (const row of rows) {
    const key = vstocksCursorKey(row);
    if (!key) {
      continue;
    }
    bySkuVariant.set(key, row);
  }

  const pending = new Map<string, number>();
  for (const [skuVariant, row] of bySkuVariant) {
    pending.set(skuVariant, normalizeStockQuantity(row));
  }

  if (pending.size === 0) {
    return { appliedVariants: 0, skippedKeys: 0 };
  }

  const skus = [...pending.keys()];
  const variantRepo = connection.rawConnection.getRepository(ProductVariant);
  const found = await variantRepo.find({
    where: { sku: In(skus) },
  });

  const variantIdToQty = new Map<string, number>();
  for (const v of found) {
    const s = String(v.sku ?? '').trim();
    const qty = pending.get(s);
    if (qty !== undefined) {
      variantIdToQty.set(String(v.id), qty);
    }
  }

  const matchedSkus = new Set(found.map(v => String(v.sku ?? '').trim()).filter(Boolean));
  let skippedKeys = 0;
  for (const sku of skus) {
    if (!matchedSkus.has(sku)) {
      skippedKeys++;
    }
  }

  let appliedVariants = 0;
  for (const [variantId, qty] of variantIdToQty) {
    await stockMovementService.adjustProductVariantStock(ctx, variantId, qty);
    appliedVariants++;
  }

  const toSave: ProductVariant[] = [];
  for (const v of found) {
    const s = String(v.sku ?? '').trim();
    const row = bySkuVariant.get(s);
    if (!row) continue;
    const cf = v.customFields;
    cf.next_stocks_1 = row.next_stocks_1 ?? null;
    cf.next_date_1 = row.next_date_1 ? new Date(row.next_date_1 as string) : null;
    cf.next_stocks_2 = row.next_stocks_2 ?? null;
    cf.next_date_2 = row.next_date_2 ? new Date(row.next_date_2 as string) : null;
    cf.next_stocks_3 = row.next_stocks_3 ?? null;
    cf.next_date_3 = row.next_date_3 ? new Date(row.next_date_3 as string) : null;
    toSave.push(v);
  }
  if (toSave.length > 0) {
    await variantRepo.save(toSave);
  }

  return { appliedVariants, skippedKeys };
}
