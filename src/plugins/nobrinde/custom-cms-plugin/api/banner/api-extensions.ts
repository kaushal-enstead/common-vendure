import gql from 'graphql-tag';

const bannerApiExtensions = gql`
  type BannerItemButton {
    label: String!
    type: String!
    openInNewTab: Boolean!
    url: String
    linkRef: JSON
  }

  type BannerItem {
    name: String!
    description: String
    assetId: String!
    index: Int!
    button: BannerItemButton
  }

  type BannerTranslation {
    id: ID!
    languageCode: LanguageCode!
    title: String!
    items: [BannerItem!]!
  }

  type Banner implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    code: String!
    title: String!
    items: [BannerItem!]!
    active: Boolean!
    customFields: JSON
    translations: [BannerTranslation!]!
    channels: [Channel!]!
  }

  type BannerList implements PaginatedList {
    items: [Banner!]!
    totalItems: Int!
  }

  # Generated at run-time by Vendure
  input BannerListOptions

  extend type Query {
    banner(id: ID!): Banner
    banners(options: BannerListOptions): BannerList!
  }

  input BannerItemButtonInput {
    label: String!
    type: String!
    openInNewTab: Boolean!
    url: String
    linkRef: JSON
  }

  input BannerItemInput {
    name: String!
    description: String
    assetId: String!
    index: Int!
    button: BannerItemButtonInput
  }

  input BannerTranslationInput {
    id: ID
    languageCode: LanguageCode!
    title: String!
    items: [BannerItemInput!]!
  }

  input CreateBannerInput {
    code: String!
    translations: [BannerTranslationInput!]!
    active: Boolean!
    customFields: JSON
  }

  input UpdateBannerInput {
    id: ID!
    code: String
    translations: [BannerTranslationInput!]
    active: Boolean
    customFields: JSON
  }

  input AssignBannersToChannelInput {
    bannerIds: [ID!]!
    channelId: ID!
  }

  input RemoveBannersFromChannelInput {
    bannerIds: [ID!]!
    channelId: ID!
  }

  extend type Mutation {
    createBanner(input: CreateBannerInput!): Banner!
    updateBanner(input: UpdateBannerInput!): Banner!
    deleteBanner(id: ID!): DeletionResponse!
    deleteBanners(ids: [ID!]!): [DeletionResponse!]!
    assignBannersToChannel(input: AssignBannersToChannelInput!): [Banner!]!
    removeBannersFromChannel(input: RemoveBannersFromChannelInput!): [Banner!]!
  }
`;

export const bannerAdminApiExtensions = gql`
  ${bannerApiExtensions}
`;

export const bannerSchemaTypes = bannerApiExtensions;
