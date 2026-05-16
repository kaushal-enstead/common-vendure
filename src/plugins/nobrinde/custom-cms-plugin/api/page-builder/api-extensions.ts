import gql from 'graphql-tag';

export const pageSchemaTypes = gql`
  type PageSeo {
    title: String
    image: String
    description: String
  }

  type Page implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    title: String!
    slug: String
    active: Boolean!
    seo: PageSeo
    blocks: [PageBlock!]!
    channels: [Channel!]!
  }

  type PageList implements PaginatedList {
    items: [Page!]!
    totalItems: Int!
  }

  input PageSeoInput {
    title: String
    image: String
    description: String
  }

  input CreatePageInput {
    title: String!
    slug: String
    active: Boolean
    seo: PageSeoInput
  }

  input UpdatePageInput {
    id: ID!
    title: String
    slug: String
    active: Boolean
    seo: PageSeoInput
  }

  input AssignPageToChannelInput {
    pageIds: [ID!]!
    channelId: ID!
  }

  input RemovePageFromChannelInput {
    pageIds: [ID!]!
    channelId: ID!
  }
`;

export const blockSchemaTypes = gql`
  # ColumnCss is a JSON object that can contain any CSS properties
  # width is a special property (number) for column width percentage
  # All other CSS properties are stored as string values

  type ColumnButton {
    label: String!
    type: String!
    openInNewTab: Boolean!
    url: String
    linkRef: JSON
  }

  type StatsItem {
    label: String!
    value: String!
  }

  # ColumnData is a union type based on column type:
  # - video: { type: "video", label?: String, url?: String }
  # - image: { type: "image", label?: String, url?: String, title?: String, subtitle?: String, button?: ColumnButton }
  # - cta: { type: "cta", title?: String, description?: String, button?: ColumnButton }
  # - content: { type: "content", description?: String }
  # - stats: { type: "stats", items?: [StatsItem] }
  # - faq: { type: "faq", itemId: String }
  # - document: { type: "document", itemId: String }
  # - banner: { type: "banner", itemId: String }
  # - news | authors | collections | kits | productVariants: {
  #     type: "news"|"authors"|"collections"|"kits"|"productVariants",
  #     filters: {
  #       combinator: "AND"|"OR",
  #       conditions: Array<{
  #         field: String,
  #         operator: "eq"|"gte",
  #         value: String|Boolean|Number
  #       }>
  #     }
  #   }
  # Using JSON to support discriminated union
  type PageBlockColumn {
    type: String!
    label: String
    css: JSON!
    data: JSON!
  }

  type PageBlockTranslation {
    id: ID!
    languageCode: LanguageCode!
    columns: [PageBlockColumn!]!
  }

  type PageBlock implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    pageId: ID!
    code: String
    index: Int!
    active: Boolean!
    css: JSON
    columns: [PageBlockColumn!]
    translations: [PageBlockTranslation!]!
  }

  # ColumnCssInput is a JSON object that can contain any CSS properties
  # width is a special property (number) for column width percentage

  input ColumnButtonInput {
    label: String!
    type: String!
    openInNewTab: Boolean!
    url: String
    linkRef: JSON
  }

  input StatsItemInput {
    label: String!
    value: String!
  }

  # ColumnDataInput is a discriminated union based on column type
  # Using JSON to support union type with different field sets
  input PageBlockColumnInput {
    type: String!
    label: String
    css: JSON!
    data: JSON!
  }

  input PageBlockTranslationInput {
    id: ID
    languageCode: LanguageCode!
    columns: [PageBlockColumnInput!]!
  }

  input CreatePageBlockInput {
    pageId: ID!
    code: String
    index: Int
    active: Boolean
    css: JSON
    translations: [PageBlockTranslationInput!]
  }

  input UpdatePageBlockInput {
    id: ID!
    code: String
    index: Int
    active: Boolean
    css: JSON
    translations: [PageBlockTranslationInput!]
  }
`;

const pageBuilderAdminOperations = gql`
  # Generated at run-time by Vendure for admin list filtering/sorting
  input PageListOptions

  extend type Query {
    page(id: ID!): Page
    pageList(options: PageListOptions): PageList!
    pageBlock(id: ID!): PageBlock
    pageBlocks(pageId: ID!): [PageBlock!]!
  }

  extend type Mutation {
    createPage(input: CreatePageInput!): Page!
    updatePage(input: UpdatePageInput!): Page!
    deletePage(id: ID!): DeletionResponse!
    deletePageList(ids: [ID!]!): [DeletionResponse!]!
    assignPageToChannel(input: AssignPageToChannelInput!): [Page!]!
    removePageFromChannel(input: RemovePageFromChannelInput!): [Page!]!
    createPageBlock(input: CreatePageBlockInput!): PageBlock!
    updatePageBlock(input: UpdatePageBlockInput!): PageBlock!
    deletePageBlock(id: ID!): DeletionResponse!
    duplicatePageBlock(id: ID!): PageBlock!
    reorderPageBlocks(blockIds: [ID!]!): [PageBlock!]!
  }
`;

export const pageBuilderSchemaTypes = gql`
  ${pageSchemaTypes}
  ${blockSchemaTypes}
`;

export const pageBuilderAdminApiExtensions = gql`
  ${pageBuilderSchemaTypes}
  ${pageBuilderAdminOperations}
`;

/**
 * Shop-only page builder types: discriminated ColumnData union, enriched item types,
 * and ShopPage/ShopPageBlock without the raw translations array.
 */
export const blockShopSchemaTypes = gql`
  type PageBlockBannerItemButton {
    label: String!
    type: String!
    openInNewTab: Boolean!
    url: String
    linkRef: JSON
  }

  type PageBlockBannerItem {
    name: String!
    description: String
    assetId: String!
    index: Int!
    button: PageBlockBannerItemButton
    asset: Asset
  }

  type PageBlockBannerData {
    id: ID!
    code: String!
    title: String!
    active: Boolean!
    items: [PageBlockBannerItem!]!
  }

  type PageBlockDocumentItem {
    name: String!
    assetId: String!
    index: Int!
    asset: Asset
  }

  type PageBlockDocumentData {
    id: ID!
    code: String!
    title: String!
    active: Boolean!
    items: [PageBlockDocumentItem!]!
  }

  type PageBlockFaqData {
    id: ID!
    code: String!
    title: String!
    active: Boolean!
    items: [FaqItem!]!
  }

  type PageBlockNewsItem {
    id: ID!
    title: String!
    description: String!
    src: String
    asset: Asset
    authorId: ID
    categoryId: ID
  }

  type PageBlockAuthorItem {
    id: ID!
    name: String!
    logo: String
    title: String!
    asset: Asset
  }

  type PageBlockFilterCondition {
    field: String!
    operator: String!
    value: String!
  }

  type PageBlockFilters {
    combinator: String!
    conditions: [PageBlockFilterCondition!]!
  }

  type VideoColumnData {
    type: String!
    label: String
    url: String
    asset: Asset
  }
  type ImageColumnData {
    type: String!
    label: String
    url: String
    title: String
    subtitle: String
    button: ColumnButton
    asset: Asset
  }
  type CtaColumnData {
    type: String!
    title: String
    description: String
    button: ColumnButton
  }
  type ContentColumnData {
    type: String!
    description: String
  }
  type StatsColumnData {
    type: String!
    items: [StatsItem!]
  }
  type FaqColumnData {
    type: String!
    itemId: String
    faq: PageBlockFaqData
  }
  type DocumentColumnData {
    type: String!
    itemId: String
    document: PageBlockDocumentData
  }
  type BannerColumnData {
    type: String!
    itemId: String
    banner: PageBlockBannerData
  }
  type NewsColumnData {
    type: String!
    filters: PageBlockFilters
    items: [PageBlockNewsItem!]
  }
  type AuthorsColumnData {
    type: String!
    filters: PageBlockFilters
    items: [PageBlockAuthorItem!]
  }
  type CollectionsColumnData {
    type: String!
    filters: PageBlockFilters
  }
  type KitsColumnData {
    type: String!
    filters: PageBlockFilters
  }
  type ProductVariantsColumnData {
    type: String!
    filters: PageBlockFilters
  }

  union ColumnData =
    | VideoColumnData
    | ImageColumnData
    | CtaColumnData
    | ContentColumnData
    | StatsColumnData
    | FaqColumnData
    | DocumentColumnData
    | BannerColumnData
    | NewsColumnData
    | AuthorsColumnData
    | CollectionsColumnData
    | KitsColumnData
    | ProductVariantsColumnData

  type ShopPageBlockColumn {
    type: String!
    label: String
    css: JSON!
    data: ColumnData!
  }

  type ShopPageBlock implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    pageId: ID!
    code: String
    index: Int!
    active: Boolean!
    css: JSON
    columns: [ShopPageBlockColumn!]!
  }

  type ShopPage implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    title: String!
    slug: String
    active: Boolean!
    seo: PageSeo
    blocks: [ShopPageBlock!]!
    channels: [Channel!]!
  }

  type ShopPageList implements PaginatedList {
    items: [ShopPage!]!
    totalItems: Int!
  }
`;
