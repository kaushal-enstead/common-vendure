import gql from 'graphql-tag';

/** Core types + mutation inputs (admin + shop). Omit list types — shop has no paginated footer query. */
export const footerSchemaTypes = gql`
  type NavLinkItemValue {
    label: String!
    type: String!
    openInNewTab: Boolean!
    url: String
    linkRef: JSON
    active: Boolean!
  }

  type NavLinkItem {
    label: String!
    active: Boolean!
    children: [NavLinkItemValue!]!
  }

  type SocialLinkItem {
    label: String!
    image: String!
    url: String!
    active: Boolean!
  }

  type FooterTranslation {
    id: ID!
    languageCode: LanguageCode!
    navLinks: [NavLinkItem!]!
    socialLinks: [SocialLinkItem!]!
  }

  type Footer implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    code: String!
    navLinks: [NavLinkItem!]!
    socialLinks: [SocialLinkItem!]!
    customFields: JSON
    translations: [FooterTranslation!]!
    channels: [Channel!]!
  }

  input NavLinkItemValueInput {
    label: String!
    type: String!
    openInNewTab: Boolean!
    url: String
    linkRef: JSON
    active: Boolean!
  }

  input NavLinkItemInput {
    label: String!
    active: Boolean!
    children: [NavLinkItemValueInput!]!
  }

  input SocialLinkItemInput {
    label: String!
    image: String!
    url: String!
    active: Boolean!
  }

  input FooterTranslationInput {
    id: ID
    languageCode: LanguageCode!
    navLinks: [NavLinkItemInput!]!
    socialLinks: [SocialLinkItemInput!]!
  }

  input CreateFooterInput {
    code: String!
    translations: [FooterTranslationInput!]!
    customFields: JSON
  }

  input UpdateFooterInput {
    id: ID!
    code: String
    translations: [FooterTranslationInput!]
    customFields: JSON
  }

  input AssignFootersToChannelInput {
    footerIds: [ID!]!
    channelId: ID!
  }

  input RemoveFootersFromChannelInput {
    footerIds: [ID!]!
    channelId: ID!
  }
`;

/** Admin only: empty ListOptions is filled by Vendure after schema build (needs a paginated query referencing it). */
const footerAdminListTypes = gql`
  type FooterList implements PaginatedList {
    items: [Footer!]!
    totalItems: Int!
  }

  # Generated at run-time by Vendure
  input FooterListOptions
`;

const footerAdminOperations = gql`
  extend type Query {
    footer(id: ID!): Footer
    footers(options: FooterListOptions): FooterList!
  }

  extend type Mutation {
    createFooter(input: CreateFooterInput!): Footer!
    updateFooter(input: UpdateFooterInput!): Footer!
    deleteFooter(id: ID!): DeletionResponse!
    deleteFooters(ids: [ID!]!): [DeletionResponse!]!
    assignFootersToChannel(input: AssignFootersToChannelInput!): [Footer!]!
    removeFootersFromChannel(input: RemoveFootersFromChannelInput!): [Footer!]!
  }
`;

export const footerAdminApiExtensions = gql`
  ${footerSchemaTypes}
  ${footerAdminListTypes}
  ${footerAdminOperations}
`;
