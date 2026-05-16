import gql from 'graphql-tag';

/** Core types + mutation inputs (admin + shop). List types are admin-only — see headerAdminListTypes. */
export const headerSchemaTypes = gql`
  type NavHeaderLinkItemValue {
    label: String!
    type: String!
    openInNewTab: Boolean!
    url: String
    linkRef: JSON
    active: Boolean!
  }

  type NavHeaderParentLinkItemValue {
    label: String!
    type: String!
    openInNewTab: Boolean!
    url: String
    linkRef: JSON
  }

  type NavHeaderLinkItem {
    label: String!
    active: Boolean!
    link: NavHeaderParentLinkItemValue
    children: [NavLinkItemValue!]
  }

  type HeaderTranslation {
    id: ID!
    languageCode: LanguageCode!
    navLinks: [NavHeaderLinkItem!]!
  }

  type Header implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    code: String!
    logo: String
    navLinks: [NavHeaderLinkItem!]!
    customFields: JSON
    translations: [HeaderTranslation!]!
    channels: [Channel!]!
  }

  input NavHeaderLinkItemValueInput {
    label: String!
    type: String!
    openInNewTab: Boolean!
    url: String
    linkRef: JSON
    active: Boolean!
  }
  input NavHeaderParentLinkItemValueInput {
    label: String!
    type: String!
    openInNewTab: Boolean!
    url: String
    linkRef: JSON
  }

  input NavHeaderLinkItemInput {
    label: String!
    active: Boolean!
    link: NavHeaderParentLinkItemValueInput
    children: [NavHeaderLinkItemValueInput!]
  }

  input HeaderTranslationInput {
    id: ID
    languageCode: LanguageCode!
    navLinks: [NavHeaderLinkItemInput!]!
  }

  input CreateHeaderInput {
    code: String!
    logo: String
    translations: [HeaderTranslationInput!]!
    customFields: JSON
  }

  input UpdateHeaderInput {
    id: ID!
    code: String
    logo: String
    translations: [HeaderTranslationInput!]
    customFields: JSON
  }

  input AssignHeadersToChannelInput {
    headerIds: [ID!]!
    channelId: ID!
  }

  input RemoveHeadersFromChannelInput {
    headerIds: [ID!]!
    channelId: ID!
  }
`;

const headerAdminListTypes = gql`
  type HeaderList implements PaginatedList {
    items: [Header!]!
    totalItems: Int!
  }

  # Generated at run-time by Vendure
  input HeaderListOptions
`;

const headerAdminOperations = gql`
  extend type Query {
    header(id: ID!): Header
    headers(options: HeaderListOptions): HeaderList!
  }

  extend type Mutation {
    createHeader(input: CreateHeaderInput!): Header!
    updateHeader(input: UpdateHeaderInput!): Header!
    deleteHeader(id: ID!): DeletionResponse!
    deleteHeaders(ids: [ID!]!): [DeletionResponse!]!
    assignHeadersToChannel(input: AssignHeadersToChannelInput!): [Header!]!
    removeHeadersFromChannel(input: RemoveHeadersFromChannelInput!): [Header!]!
  }
`;

export const headerAdminApiExtensions = gql`
  ${headerSchemaTypes}
  ${headerAdminListTypes}
  ${headerAdminOperations}
`;
