type OptionConfig = {
  code: string;
  names: Record<string, string>;
  valueKeys: string[];
};

export const variantOptionConfigs: OptionConfig[] = [
  {
    code: 'color',
    names: { en: 'Color', pt: 'Cor' },
    valueKeys: ['color_en', 'color_pt', 'color_code', 'color_es', 'color_fr'],
  },
  {
    code: 'size',
    names: { en: 'Size', pt: 'Tamanho' },
    valueKeys: ['size_en', 'size_pt', 'size_es', 'size_fr'],
  },
];

export function sqlPriceTiersJsonForAlias(alias: string): string {
  const p = alias.length ? `${alias}.` : '';
  return `(
    SELECT p_val AS price, q_start AS quantityStart, q_end AS quantityEnd
    FROM (VALUES 
      (${p}price_1 * 100.0, ${p}min_qty, ${p}max_qty_1),
      (${p}price_2 * 100.0, ${p}min_qty_2, ${p}max_qty_2),
      (${p}price_3 * 100.0, ${p}min_qty_3, ${p}max_qty_3),
      (${p}price_4 * 100.0, ${p}min_qty_4, ${p}max_qty_4),
      (${p}price_5 * 100.0, ${p}min_qty_5, ${p}max_qty_5),
      (${p}price_6 * 100.0, ${p}min_qty_6, ${p}max_qty_6),
      (${p}price_7 * 100.0, ${p}min_qty_7, ${p}max_qty_7),
      (${p}price_8 * 100.0, ${p}min_qty_8, ${p}max_qty_8),
      (${p}price_9 * 100.0, ${p}min_qty_9, ${p}max_qty_9),
      (${p}price_10 * 100.0, ${p}min_qty_10, ${p}max_qty_10),
      (${p}price_11 * 100.0, ${p}min_qty_11, ${p}max_qty_11),
      (${p}price_12 * 100.0, ${p}min_qty_12, ${p}max_qty_12),
      (${p}price_13 * 100.0, ${p}min_qty_13, ${p}max_qty_13),
      (${p}price_14 * 100.0, ${p}min_qty_14, ${p}max_qty_14)
    ) AS v(p_val, q_start, q_end)
    WHERE p_val IS NOT NULL AND q_start > 0
    FOR JSON PATH
  )`;
}

const PRICE_TIERS_CTE = `
        WITH PriceTiers AS (
        SELECT 
            sku, 
            sku_variant,
            min_qty,
            ${sqlPriceTiersJsonForAlias('')} AS prices_json
        FROM VPRICES_PHC_DATA
    )`;

/** Stock + price tiers for one sellable line: same shape for `simple` and `grouped` parents (`p.*` includes `product_relations_json` for grouped). */
const SIMPLE_OR_GROUPED_VARIANTS_SUBQUERY = `
                (
                    SELECT p.*,
                        vs.has_stock,
                        vs.stocks,
                        vs.date_created AS stock_date_created,
                        vs.date_updated AS stock_date_updated,
                        pt.min_qty AS min_quantity,
                        pt.prices_json AS prices
                    FROM VSTOCKS_DATA vs
                    OUTER APPLY (
                        SELECT TOP 1 min_qty, prices_json
                        FROM PriceTiers pt
                        WHERE pt.sku = p.sku
                        ORDER BY min_qty
                    ) pt
                    WHERE vs.sku = p.sku
                    FOR JSON PATH
                )`;

const VARIABLE_VARIANTS_SUBQUERY = `
                (
                    SELECT 
                        v.*, 
                        vs.has_stock,
                        vs.stocks,
                        vs.date_created AS stock_date_created,
                        vs.date_updated AS stock_date_updated,
                        pd.min_qty AS min_quantity, 
                        pd.prices_json AS prices
                    FROM VPRODUCTS v
                    LEFT JOIN VSTOCKS_DATA vs ON vs.sku_variant = v.sku_variant
                    OUTER APPLY (
                        SELECT TOP 1 pt.min_qty, pt.prices_json
                        FROM PriceTiers pt
                        WHERE (pt.sku = v.sku AND pt.sku_variant = v.sku_variant)
                          OR (pt.sku = p.sku AND (pt.sku_variant IS NULL OR pt.sku_variant = ''))
                        ORDER BY (CASE WHEN pt.sku_variant = v.sku_variant THEN 0 ELSE 1 END) ASC
                    ) pd
                    WHERE v.product_type = 'variation'
                      AND v.sku = p.sku
                    FOR JSON PATH
                )`;

export function buildProductSyncByExternalIdsQuery(productIds: number[]): { sql: string; params: number[] } {
  const placeholders = productIds.map((_, i) => `@p${i}`).join(', ');
  const sql = `
    ${PRICE_TIERS_CTE}
    SELECT
        p.*,
        CASE 
            WHEN p.product_type IN ('simple', 'grouped') THEN
                ${SIMPLE_OR_GROUPED_VARIANTS_SUBQUERY}
            ELSE
                ${VARIABLE_VARIANTS_SUBQUERY}
        END AS variants
    FROM VPRODUCTS p
    WHERE p.id IN (${placeholders})
      `;
  return { sql, params: productIds };
}
