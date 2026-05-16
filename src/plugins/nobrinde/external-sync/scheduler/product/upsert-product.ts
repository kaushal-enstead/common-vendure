import { TransactionalConnection, Channel, Product, ProductTranslation } from '@vendure/core';
import { SyncResult } from '../../types';
import { parseJson, parseCustomField, slugify } from '../../utils/helper';
import {
  ProductRow,
  LanguageRow,
  DescriptionRow,
  SeoMetadataRow,
  LLMMetadataRow,
  ProductRelationsJson,
} from './types';
import { upsertAssets } from './upsert-asset';
import { In } from 'typeorm';
import { assignChannels } from './assign-channel';

function groupedChildSkusFromRow(row: ProductRow): string[] | null {
  if (String(row.product_type) !== 'grouped') {
    return null;
  }
  const rel = parseJson<ProductRelationsJson>(row.product_relations_json);
  const raw = rel?.children_skus;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map(s => String(s).trim()).filter(Boolean);
}

async function resolveVendureIds(
  connection: TransactionalConnection,
  keys: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const uniq = [...new Set(keys)];
  if (!uniq.length) return map;

  // Single query — MySQL IN() handles thousands of values fine
  const placeholders = uniq.map(() => '?').join(',');
  const rows: { id: string; ext: string }[] = await connection.rawConnection.query(
    `SELECT \`id\`, \`customFieldsMain_sku\` AS ext FROM \`product\` WHERE \`customFieldsMain_sku\` IN (${placeholders})`,
    uniq,
  );
  for (const row of rows) map.set(row.ext, row.id);
  return map;
}

export async function upsertProducts(
  connection: TransactionalConnection,
  defaultChannel: Channel | null,
  rows: ProductRow[],
  languageCodes: (keyof LanguageRow)[],
  resultObject: SyncResult,
) {
  const productRepo = connection.rawConnection.getRepository(Product);
  const productTranslationRepo = connection.rawConnection.getRepository(ProductTranslation);

  // Resolve existing product IDs by main_sku so external products with different IDs
  // are updated rather than duplicated.
  const incomingSkus = rows.map(row => row.sku).filter(Boolean);
  const existingIds = await resolveVendureIds(connection, incomingSkus);

  // Products
  const productsToUpsert = rows.map(row => {
    const id = existingIds.get(String(row.sku).trim()) ?? row.id.toString();

    // const enabled = !!row.is_active && !!row.is_visible && !row.is_discontinued;
    // const deletedAt = row.is_discontinued && row.date_discontinued ? new Date(row.date_discontinued) : null;

    return new Product({
      id,
      enabled: !!row.is_active,
      //   deletedAt,
      customFields: {
        main_sku: row.sku,
        sku_mba: row.sku_mba,
        external_product_type: row.product_type != null ? String(row.product_type) : null,
        grouped_child_skus: groupedChildSkusFromRow(row),
        is_printable: row.is_printable,
        measurements: parseJson<any>(row.measurements_json),
        packaging: row.packaging_json ?? null,
        digital_assets: parseJson<any>(row.digital_assets_id_json),
        printings: row.printings_json,
      },
    } as any);
  });
  if (productsToUpsert.length === 0) {
    return;
  }
  await productRepo.upsert(productsToUpsert, ['id']);

  // Product translations
  const productIds = productsToUpsert.map(p => p.id!.toString());
  await productTranslationRepo.delete({ base: { id: In(productIds) } });
  const productTranslations = rows.flatMap(row =>
    languageCodes.map(languageCode => {
      const code = languageCode as string;
      const name = (row[`name_${code}` as keyof ProductRow] as string) ?? (row.name_en as string) ?? row.sku;

      const slugSource = (row.name_en as string) || name || row.sku || row.id.toString();
      return new ProductTranslation({
        languageCode,
        name,
        slug: slugify(slugSource),
        description:
          parseCustomField<DescriptionRow>(
            row?.description_json,
            desc =>
              desc?.blocks?.[0]?.['conteudo']?.[languageCode]
                ? `<p>${desc.blocks?.[0]?.['conteudo']?.[languageCode]}</p>`
                : '',
            false,
          ) ?? '',
        base: { id: row.id.toString() },
        customFields: {
          seo_metadata: parseCustomField<SeoMetadataRow>(row?.seo_metadata_json, seo => ({
            description: seo?.meta?.description?.[languageCode] ?? '',
            title: seo?.meta?.title?.[languageCode] ?? '',
          })),
          llm_metadata: parseCustomField<LLMMetadataRow>(row?.llm_metadata_json, llm => ({
            keywords: llm?.keywords?.[languageCode] ?? '',
            useCases: llm?.useCases ?? [],
          })),
          material: parseCustomField<LanguageRow>(row?.material_json, m => m[languageCode], false),
          //   composition: parseCustomField<LanguageRow>(row.composition_json, c => c[languageCode]),
          //   size_chart: parseCustomField<string>(row.size_chart_json),
          //   prod_custom_fields: parseCustomField<string>(row.prod_custom_fields_json),
          printings: parseCustomField<string>(row?.printings_json),
          packaging: parseCustomField<string>(row?.packaging_json),
        },
      } as any);
    }),
  );
  if (productTranslations.length > 0) {
    await productTranslationRepo.insert(productTranslations);
  }

  // Product assets
  // console.time('upsertProductAssets');
  await upsertAssets(
    connection,
    defaultChannel,
    rows.map(row => ({ ...row, entityId: row.id.toString() })),
    'product',
    productIds,
    languageCodes,
  );
  // console.timeEnd('upsertProductAssets');

  // Product channels
  await assignChannels(connection, defaultChannel, 'product', productIds);

  if (resultObject.upsertedRows) {
    resultObject.upsertedRows += productsToUpsert.length;
  } else {
    resultObject.upsertedRows = productsToUpsert.length;
  }
}
