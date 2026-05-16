import {
  Channel,
  Facet,
  FacetTranslation,
  FacetValue,
  FacetValueTranslation,
  LanguageCode,
  TransactionalConnection,
} from '@vendure/core';
import { In } from 'typeorm';

export type TagRow = {
  id: number | string;
  code_slug: string;
  name_pt: string;
  name_en: string;
  name_es: string;
  name_fr: string;
  tag_config_json: string;
  is_active: boolean;
  date_created: Date;
  date_updated: Date;
  tag_values: string;
};

export type TagValueRow = {
  id: number | string;
  tag_id: number | string;
  code_slug: string;
  name_pt: string;
  name_en: string;
  name_es: string;
  name_fr: string;
  tag_values_config_json: string;
  is_active: boolean;
  date_created: Date;
  date_updated: Date;
};

const FACET_TRANSLATION_NAMES: (keyof TagRow)[] = ['name_pt', 'name_en', 'name_es', 'name_fr'];
const FACET_VALUE_TRANSLATION_NAMES: (keyof TagValueRow)[] = ['name_pt', 'name_en', 'name_es', 'name_fr'];

export function buildFacetsQuery(whereClause?: string): string {
  return `
    SELECT *
    FROM VTAGS
    ${whereClause ? `WHERE ${whereClause}` : ''}
    ORDER BY id ASC;
  `;
}

export function buildFacetValuesQuery(whereClause?: string): string {
  return `
    SELECT *
    FROM VTAG_VALUES
    ${whereClause ? `WHERE ${whereClause}` : ''}
    ORDER BY id ASC;
  `;
}

export async function upsertFacetsFromRows(
  connection: TransactionalConnection,
  defaultChannel: Channel,
  rows: TagRow[],
): Promise<number> {
  if (!rows.length) {
    return 0;
  }

  const facetRepo = connection.rawConnection.getRepository(Facet);
  const facetTranslationRepo = connection.rawConnection.getRepository(FacetTranslation);
  const normalizedRows = rows.map(row => ({
    ...row,
    id: row.id.toString(),
    translations: FACET_TRANSLATION_NAMES.map(name => ({
      languageCode: name.split('_')[1] as LanguageCode,
      name: row[name] as string,
    })),
  }));

  await facetRepo.upsert(
    normalizedRows.map(row => ({ id: row.id, code: row.code_slug, isPrivate: row.is_active })),
    ['id'],
  );
  await facetTranslationRepo.delete({ base: { id: In(normalizedRows.map(row => row.id)) } });
  await facetTranslationRepo.insert(
    normalizedRows.flatMap(row =>
      row.translations.map(translation => ({
        languageCode: translation.languageCode,
        name: translation.name,
        base: { id: row.id.toString() },
      })),
    ),
  );

  await connection.rawConnection
    .createQueryBuilder()
    .insert()
    .into('facet_channels_channel')
    .values(
      normalizedRows.map(row => ({
        facetId: row.id.toString(),
        channelId: defaultChannel.id,
      })),
    )
    .orIgnore()
    .execute();

  return normalizedRows.length;
}

export async function upsertFacetValuesFromRows(
  connection: TransactionalConnection,
  defaultChannel: Channel,
  rows: TagValueRow[],
): Promise<number> {
  if (!rows.length) {
    return 0;
  }

  const facetValueRepo = connection.rawConnection.getRepository(FacetValue);
  const facetValueTranslationRepo = connection.rawConnection.getRepository(FacetValueTranslation);
  const normalizedRows = rows.map(row => ({ ...row, id: row.id.toString() }));

  await facetValueRepo.upsert(
    normalizedRows.map(row => ({
      id: row.id.toString(),
      code: row.code_slug,
      facetId: row.tag_id.toString(),
    })),
    ['id'],
  );

  await facetValueTranslationRepo.delete({
    base: { id: In(normalizedRows.map(row => row.id.toString())) },
  });

  await facetValueTranslationRepo.insert(
    normalizedRows.flatMap(row =>
      FACET_VALUE_TRANSLATION_NAMES.map(name => ({
        languageCode: name.split('_')[1] as LanguageCode,
        name: row[name] as string,
        base: { id: row.id.toString() },
      })),
    ),
  );

  await connection.rawConnection
    .createQueryBuilder()
    .insert()
    .into('facet_value_channels_channel')
    .values(
      normalizedRows.map(row => ({
        facetValueId: row.id.toString(),
        channelId: defaultChannel.id,
      })),
    )
    .orIgnore()
    .execute();

  return normalizedRows.length;
}
