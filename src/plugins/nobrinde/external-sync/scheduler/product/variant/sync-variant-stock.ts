import { RequestContext, StockMovementService } from '@vendure/core';
import { ProductRow } from '../types';
import { buildVariantRows } from '../variant-utils';

/** Shared by product-row sync and VSTOCKS_DATA batch sync. */
export function normalizeStockQuantity(variant: Pick<ProductRow, 'has_stock' | 'stocks'>): number {
  const hasStock = variant.has_stock;
  const hasNoStock =
    hasStock === false || hasStock === 0 || hasStock === '0' || hasStock === 'false' || hasStock == null;

  if (hasNoStock) {
    return 0;
  }

  const parsed = Number(variant.stocks ?? 0);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.floor(parsed);
}

export async function syncVariantStock(
  ctx: RequestContext,
  stockMovementService: StockMovementService,
  rows: ProductRow[],
): Promise<void> {
  const variantRows = buildVariantRows(rows);
  if (variantRows.length === 0) {
    return;
  }

  const desiredStockByVariantId = new Map<string, number>();
  for (const variantRow of variantRows) {
    desiredStockByVariantId.set(variantRow.variantId, normalizeStockQuantity(variantRow.variant));
  }

  for (const [variantId, stockOnHand] of desiredStockByVariantId.entries()) {
    await stockMovementService.adjustProductVariantStock(ctx, variantId, stockOnHand);
  }
}
