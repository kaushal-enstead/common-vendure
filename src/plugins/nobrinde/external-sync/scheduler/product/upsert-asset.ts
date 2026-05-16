import { randomUUID } from 'crypto';
import {
  TransactionalConnection,
  Channel,
  Asset,
  AssetTranslation,
  LanguageCode,
  ProductAsset,
  ProductVariantAsset,
  AssetType,
  CollectionAsset,
} from '@vendure/core';
import { parseJson, getImageDimensionsBatch } from '../../utils/helper';
import { assignChannels } from './assign-channel';
import { ProductRow, ImageRow, LanguageRow, CollectionImageRow } from './types';
import { In } from 'typeorm';
import { CollectionRow } from '../collection/sync-collection-utils';
type AssetScope = 'product' | 'variant' | 'collection';

type ImageItem = {
  entity: (ProductRow & { id: string | number }) | CollectionRow;
  entityId: string;
  imgRow: ImageRow | CollectionImageRow;
  idx: number;
};

// ---- helpers ----------------------------------------------------------------

function externalKey(entityId: string, idx: number, type: AssetScope) {
  return type === 'collection' ? `collection-img-${entityId}` : `img-${entityId}-${idx + 1}`;
}

function assetName(entity: ProductRow | CollectionRow, type: AssetScope, idx: number, ext: string) {
  if (type === 'collection') {
    return `collection-${(entity as CollectionRow).category_id}.${ext}`;
  }

  const base = entity as ProductRow;
  return type === 'product'
    ? `product-img-${base.sku}-${idx + 1}.${ext}`
    : `variant-img-${base.sku_variant || base.sku}-${idx + 1}.${ext}`;
}

function collectItems(rows: (ProductRow | CollectionRow)[], type: AssetScope): ImageItem[] {
  if (type === 'collection') {
    return rows
      .map(row => {
        const colRow = row as CollectionRow;
        const media =
          typeof colRow.media_json === 'string' ? JSON.parse(colRow.media_json || '{}') : colRow.media_json;

        if (!media?.url) return null;

        return {
          entity: row,
          entityId: colRow.category_id.toString(),
          imgRow: media,
          idx: 0,
        };
      })
      .filter(Boolean) as ImageItem[];
  }

  // product / variant
  return rows.flatMap(entity => {
    const row = entity as ProductRow;
    const entityId = row.id.toString();
    return (parseJson<any[]>(row.img_json) ?? []).map((imgRow, idx) => ({
      entity,
      entityId,
      imgRow,
      idx,
    }));
  });
}

async function clearLinks(connection: TransactionalConnection, type: AssetScope, ids: string[]) {
  if (type === 'product') {
    await connection.rawConnection.getRepository(ProductAsset).delete({ productId: In(ids) });
  } else if (type === 'variant') {
    await connection.rawConnection.getRepository(ProductVariantAsset).delete({
      productVariantId: In(ids),
    });
  } else {
    await connection.rawConnection.getRepository(CollectionAsset).delete({
      collectionId: In(ids),
    });
  }
}

async function insertLinks(connection: TransactionalConnection, type: AssetScope, links: any[]) {
  if (!links.length) return;

  if (type === 'product') {
    await connection.rawConnection.getRepository(ProductAsset).insert(links);
  } else if (type === 'variant') {
    await connection.rawConnection.getRepository(ProductVariantAsset).insert(links);
  } else {
    await connection.rawConnection.getRepository(CollectionAsset).insert(links);
  }
}

async function updateFeaturedAssets(
  connection: TransactionalConnection,
  featuredMap: Record<string, string>,
  type: AssetScope,
) {
  const entries = Object.entries(featuredMap);
  if (!entries.length) return;

  const table = type === 'product' ? 'product' : type === 'variant' ? 'product_variant' : 'collection';

  const esc = (v: string) => `'${v.replace(/'/g, "''")}'`;
  const q = (s: string) => `\`${s}\``;

  const when = entries.map(([id, assetId]) => `WHEN ${q('id')} = ${esc(id)} THEN ${esc(assetId)}`).join(' ');

  const ids = entries.map(([id]) => esc(id)).join(',');

  await connection.rawConnection.query(
    `UPDATE ${q(table)} SET ${q('featuredAssetId')} = CASE ${when} END WHERE ${q('id')} IN (${ids})`,
  );
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
    `SELECT \`id\`, \`customFieldsExternal_id\` AS ext FROM \`asset\` WHERE \`customFieldsExternal_id\` IN (${placeholders})`,
    uniq,
  );
  for (const row of rows) map.set(row.ext, row.id);
  return map;
}

// ---- main -------------------------------------------------------------------

export async function upsertAssets(
  connection: TransactionalConnection,
  defaultChannel: Channel | null,
  rows: any[],
  type: AssetScope,
  ids: string[],
  languageCodes?: (keyof LanguageRow)[],
) {
  await clearLinks(connection, type, ids);

  const items = collectItems(rows, type);
  if (!items.length) return;

  const keys = items.map(({ entityId, idx }) => externalKey(entityId, idx, type));
  const existingIds = await resolveVendureIds(connection, keys);

  const dimensions =
    type === 'collection'
      ? items.map(() => null) // collections don’t use dimension util
      : await getImageDimensionsBatch(items.map(i => ({ url: (i.imgRow as ImageRow)?.url_highress })));

  const assets: Asset[] = [];
  const links: any[] = [];
  const featuredMap: Record<string, string> = {};
  const vendureIds: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const { entity, entityId, imgRow, idx } = items[i];

    const key = externalKey(entityId, idx, type);
    if (seen.has(key)) continue;
    seen.add(key);

    const vendureId = existingIds.get(key) ?? randomUUID();

    const source =
      type === 'collection'
        ? (imgRow.url ?? (imgRow as CollectionImageRow).icon)
        : ((imgRow as ImageRow)?.url_highress ?? '');

    const preview = type === 'collection' ? source : (imgRow?.url ?? '');

    const ext = source.split('.').pop()?.split('?')[0] ?? 'jpg';
    const dim = dimensions[i];

    assets.push(
      new Asset({
        id: vendureId,
        name: assetName(entity, type, idx, ext),
        source,
        preview,
        type: AssetType.IMAGE,
        mimeType: dim?.mimeType ?? 'image/jpeg',
        width: dim?.width ?? 0,
        height: dim?.height ?? 0,
        fileSize: dim?.fileSize ?? 0,
        customFields: { external_id: key },
      } as any),
    );

    // links
    if (type === 'product') {
      links.push(new ProductAsset({ productId: entityId, assetId: vendureId, position: idx + 1 }));
    } else if (type === 'variant') {
      links.push(
        new ProductVariantAsset({
          productVariantId: entityId,
          assetId: vendureId,
          position: idx + 1,
        }),
      );
    } else {
      links.push(
        new CollectionAsset({
          collectionId: entityId,
          assetId: vendureId,
          position: 1,
        }),
      );
    }

    featuredMap[entityId] ??= vendureId;
    vendureIds.push(vendureId);
  }

  // save assets
  await connection.rawConnection.getRepository(Asset).save(assets, { chunk: 500 });

  // translations (skip for collection if you want)
  if (languageCodes?.length && type !== 'collection') {
    const repo = connection.rawConnection.getRepository(AssetTranslation);

    await repo.delete({ base: { id: In(vendureIds) } });

    await repo.insert(
      assets.flatMap(a =>
        languageCodes.map(
          lc =>
            new AssetTranslation({
              languageCode: lc as LanguageCode,
              name: String(a.name ?? ''),
              base: { id: a.id },
            } as any),
        ),
      ),
    );
  }

  await insertLinks(connection, type, links);

  await updateFeaturedAssets(connection, featuredMap, type);

  if (defaultChannel) {
    await assignChannels(connection, defaultChannel, 'asset', vendureIds);
  }
}
