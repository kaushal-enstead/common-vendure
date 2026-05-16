import gql from 'graphql-tag';
import { footerSchemaTypes } from '../footer/api-extensions';
import { headerSchemaTypes } from '../header/api-extensions';
import { authorSchemaTypes } from '../author/api-extensions';
import { categorySchemaTypes } from '../category/api-extensions';
import { newsSchemaTypes } from '../news/api-extensions';
import { faqSchemaTypes } from '../faq/api-extensions';
import { documentSchemaTypes } from '../document/api-extensions';
import { pageSchemaTypes, blockSchemaTypes, blockShopSchemaTypes } from '../page-builder/api-extensions';
import { bannerSchemaTypes } from '../banner/api-extensions';

/**
 * Shop API: reuses CMS type definitions from admin schema modules; only adds storefront queries.
 * Footer is listed before header so `NavLinkItemValue` exists for `Header` types.
 * Page builder uses shop-specific types (ShopPage/ShopPageBlock) with typed ColumnData union
 * and no raw translations array.
 */
export const cmsShopApiExtensions = gql`
  ${footerSchemaTypes}
  ${headerSchemaTypes}
  ${authorSchemaTypes}
  ${categorySchemaTypes}
  ${newsSchemaTypes}
  ${faqSchemaTypes}
  ${documentSchemaTypes}
  ${pageSchemaTypes}
  ${blockSchemaTypes}
  ${blockShopSchemaTypes}
  ${bannerSchemaTypes}

  extend type Query {
    # getPages(options: PageListOptions): ShopPageList!
    "Published page on the current channel; pass exactly one of id or slug. Request nested blocks as needed."
    getPage(id: ID, slug: String): ShopPage
    getHeader(id: ID, code: String): Header
    getFooter(id: ID, code: String): Footer
    getNews(options: NewsListOptions): NewsList!
    getAuthors(options: AuthorListOptions): AuthorList!
    getFaq(options: FaqListOptions): FaqList!
    getDocuments(options: DocumentListOptions): DocumentList!
    getDocument(id: ID!): Document
    getBanners(options: BannerListOptions): BannerList!
    getBanner(id: ID!): Banner
  }
`;
