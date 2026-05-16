import { Resolver, ResolveField } from '@nestjs/graphql';

const COLUMN_TYPE_MAP: Record<string, string> = {
  video: 'VideoColumnData',
  image: 'ImageColumnData',
  cta: 'CtaColumnData',
  content: 'ContentColumnData',
  stats: 'StatsColumnData',
  faq: 'FaqColumnData',
  document: 'DocumentColumnData',
  banner: 'BannerColumnData',
  news: 'NewsColumnData',
  authors: 'AuthorsColumnData',
  collections: 'CollectionsColumnData',
  kits: 'KitsColumnData',
  productVariants: 'ProductVariantsColumnData',
};

@Resolver('ColumnData')
export class ColumnDataUnionResolver {
  @ResolveField('__resolveType')
  __resolveType(obj: { type: string }): string {
    return COLUMN_TYPE_MAP[obj.type] ?? 'ContentColumnData';
  }
}
