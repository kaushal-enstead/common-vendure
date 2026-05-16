import {
  Channel,
  Collection,
  CollectionTranslation,
  LanguageCode,
  RequestContext,
  TransactionalConnection,
} from '@vendure/core';
import { ROOT_COLLECTION_NAME } from '@vendure/common/lib/shared-constants';
import { In } from 'typeorm';

type Media = {
  url: string;
  icon: string;
};

type PageContent = {
  title: string;
  intro: string;
  desc: string;
};
type SeoMeta = {
  m_title: string;
  m_desc: string;
};

type SemanticKnowledge = {
  keywords: string[];
  synonyms: string[];
  audience: string[];
  use_cases: string[];
};

type Faq = {
  question: string;
  answer: string;
};

type GlobalMetadata = {
  google_id: string;
  wiki_id: string;
  sameAs: string;
};
/**
 * eg
 * 
 * {
  "takeaways": [
    "Jogos corporativos multiplicam impressões de marca por serem usados em grupo",
    "A técnica de personalização ideal depende do material base do jogo",
    "Maior volume de encomenda reduz custo unitário de forma proporcional"
  ],
  "guide": "Se o evento é de interior com grupos pequenos, escolhe jogos de mesa ou cartas personalizados; se o contexto é team building ao ar livre ou feiras, opta por jogos de exterior de maior dimensão. Para presentes de fim de ano individuais, prefere jogos compactos e embalagem premium.",
  "pros_cons": {
    "pros": [
      "exposição de marca partilhada por múltiplos utilizadores em cada sessão de jogo",
      "alta memorabilidade associada à experiência lúdica positiva com a marca"
    ],
    "cons": [
      "volume e peso de certos jogos de exterior pode encarecer a logística de entrega",
      "artigos com muitas peças pequenas exigem embalagem reforçada para evitar perdas em transporte"
    ]
  },
  "comp_table": {
    "headers": [
      "Critério",
      "Jogos de Mesa",
      "Jogos de Exterior",
      "Jogos de Cartas"
    ],
    "rows": [
      [
        "Portabilidade",
        "Média",
        "Baixa",
        "Elevada"
      ],
      [
        "Área de personalização",
        "Elevada",
        "Elevada",
        "Média"
      ],
      [
        "Custo logístico",
        "Média",
        "Elevada",
        "Baixa"
      ],
      [
        "Adequação a feiras",
        "Média",
        "Elevada",
        "Elevada"
      ],
      [
        "Durabilidade da personalização",
        "Média",
        "Elevada",
        "Média"
      ]
    ]
  },
  "related": [
    "Brindes para Eventos",
    "Team Building",
    "Brindes de Natal",
    "Artigos para Crianças"
  ]
}
 */
type RichContent = {
  takeaways: string[];
  guide: string;
  pros_cons: {
    pros: string[];
    cons: string[];
  };
  comp_table: {
    headers: string;
    rows: [][];
  };
  related: string[];
};

export type CollectionRow = {
  category_id: number | string;
  category_type: string;
  top_menu_order: number;
  /** url + icon — used to create/update the collection's featured asset */
  media_json: string | Media;
  global_metadata_json: string | GlobalMetadata;
  name_pt: string;
  name_es: string;
  name_en: string;
  name_fr: string;
  description_pt: string;
  description_en: string;
  description_es: string;
  description_fr: string;
  meta_title_pt: string;
  meta_title_en: string;
  meta_title_es: string;
  meta_title_fr: string;
  meta_description_pt: string;
  meta_description_en: string;
  meta_description_es: string;
  meta_description_fr: string;
  page_content_pt_json: string | PageContent;
  page_content_en_json: string | PageContent;
  page_content_es_json: string | PageContent;
  page_content_fr_json: string | PageContent;
  seo_metadata_pt_json: string | SeoMeta;
  seo_metadata_en_json: string | SeoMeta;
  seo_metadata_es_json: string | SeoMeta;
  seo_metadata_fr_json: string | SeoMeta;
  semantic_knowledge_pt_json: string | SemanticKnowledge;
  semantic_knowledge_en_json: string | SemanticKnowledge;
  semantic_knowledge_es_json: string | SemanticKnowledge;
  semantic_knowledge_fr_json: string | SemanticKnowledge;
  rich_content_pt_json: string | RichContent;
  rich_content_en_json: string | RichContent;
  rich_content_es_json: string | RichContent;
  rich_content_fr_json: string | RichContent;
  faqs_json: string | Record<string, Faq[]>;
  is_active: boolean;
  parent_id: number | string;
};

export function buildCollectionsQuery(whereClause?: string): string {
  return `
    SELECT
      c.*,
      r.parent_id
    FROM
      VCATEGORIES c
      LEFT JOIN mba_category_relations r ON r.child_id = c.category_id
    ${whereClause ? `WHERE ${whereClause}` : ''}
    ORDER BY c.category_id ASC;
  `;
}

export async function getRootCollection(
  ctx: RequestContext,
  connection: TransactionalConnection,
  defaultChannel: Channel,
): Promise<Collection> {
  let existingRoot = await connection
    .getRepository(ctx, Collection)
    .createQueryBuilder('collection')
    .leftJoin('collection.channels', 'channel')
    .leftJoin('collection.translations', 'translation')
    .where('collection.isRoot = :isRoot', { isRoot: true })
    .andWhere('channel.id = :channelId', { channelId: defaultChannel.id })
    .getOne();

  if (!existingRoot) {
    existingRoot = await connection.rawConnection.getRepository(Collection).save(
      new Collection({
        isRoot: true,
        position: 0,
        channels: [defaultChannel],
        filters: [],
      }),
    );
  }

  if (!existingRoot.translations) {
    const translation = await connection.rawConnection.getRepository(CollectionTranslation).save(
      new CollectionTranslation({
        languageCode: LanguageCode.en,
        name: ROOT_COLLECTION_NAME,
        description: 'The root of the Collection tree.',
        slug: ROOT_COLLECTION_NAME,
        base: { id: existingRoot.id },
      }),
    );
  }

  return existingRoot;
}

export async function upsertCollectionsFromRows(
  connection: TransactionalConnection,
  defaultChannel: Channel,
  rows: CollectionRow[],
  rootCollectionId: string | number,
): Promise<number> {
  if (!rows.length) {
    return 0;
  }

  const collectionRepo = connection.rawConnection.getRepository(Collection);
  const collectionTranslationRepo = connection.rawConnection.getRepository(CollectionTranslation);
  const languageCodes: LanguageCode[] = [LanguageCode.pt, LanguageCode.en, LanguageCode.es, LanguageCode.fr];

  const safeJson = (v: unknown): string => {
    if (!v) return '';
    if (typeof v === 'string') return v;
    return JSON.stringify(v);
  };

  const toUpsert = rows.map((row, index) => ({
    id: row.category_id,
    isPrivate: !row.is_active,
    position: row.top_menu_order ?? index + 1,
    isRoot: false,
    parentId: row.parent_id ?? rootCollectionId,
    inheritFilters: true,
    filters: [],
    translations: languageCodes.map(languageCode => {
      const code = languageCode as string;
      const name = row[`name_${code}` as keyof CollectionRow] ?? '';
      const description = row[`description_${code}` as keyof CollectionRow] ?? '';
      const pageContent = safeJson(row[`page_content_${code}_json` as keyof CollectionRow]);
      const seoMetadata = safeJson(row[`seo_metadata_${code}_json` as keyof CollectionRow]);
      const semanticKnowledge = safeJson(row[`semantic_knowledge_${code}_json` as keyof CollectionRow]);
      const richContent = safeJson(row[`rich_content_${code}_json` as keyof CollectionRow]);
      const faqsData = row[`faqs_json` as keyof CollectionRow] as string;
      const faqs = faqsData ? safeJson(JSON.parse(faqsData)?.[code] ?? null) : null;
      return {
        languageCode,
        name: String(name),
        slug: row.name_en,
        description: String(description),
        baseId: row.category_id,
        pageContent,
        seoMetadata,
        semanticKnowledge,
        richContent,
        faqs,
      };
    }),
    customFields: {
      categoryType: row.category_type,
      // struct type → pass parsed object so TypeORM writes to the json column directly
      globalMetadata: row.global_metadata_json
        ? typeof row.global_metadata_json === 'string'
          ? JSON.parse(row.global_metadata_json)
          : row.global_metadata_json
        : null,
    },
  }));

  await collectionRepo.upsert([...toUpsert], ['id']);

  // Use string IDs so MySQL compares baseId (varchar) without casting to DOUBLE.
  const collectionIds = toUpsert.map(row => String(row.id));
  await collectionTranslationRepo.delete({ base: { id: In(collectionIds) } });
  await collectionTranslationRepo.insert(
    toUpsert.flatMap(row =>
      row.translations.map(t => ({
        languageCode: t.languageCode,
        name: t.name,
        slug: t.slug || '',
        description: t.description || '',
        base: { id: String(t.baseId) },
        customFields: {
          pageContent: t.pageContent || '',
          seoMetadata: t.seoMetadata || '',
          semanticKnowledge: t.semanticKnowledge || '',
          richContent: t.richContent || '',
          faqs: t.faqs || '',
        },
      })),
    ),
  );

  await connection.rawConnection
    .createQueryBuilder()
    .insert()
    .into('collection_channels_channel')
    .values(
      toUpsert.map(row => ({
        collectionId: String(row.id),
        channelId: defaultChannel.id,
      })),
    )
    .orIgnore()
    .execute();

  return toUpsert.length;
}
