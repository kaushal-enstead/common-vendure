import gql from 'graphql-tag';

export const documentSchemaTypes = gql`
  type DocumentItem {
    name: String!
    assetId: String!
    index: Int!
  }

  type DocumentTranslation {
    id: ID!
    languageCode: LanguageCode!
    title: String!
    items: [DocumentItem!]!
  }

  type Document implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    code: String!
    title: String!
    items: [DocumentItem!]!
    active: Boolean!
    customFields: JSON
    translations: [DocumentTranslation!]!
    channels: [Channel!]!
  }

  type DocumentList implements PaginatedList {
    items: [Document!]!
    totalItems: Int!
  }

  # Generated at run-time by Vendure
  input DocumentListOptions

  input DocumentItemInput {
    name: String!
    assetId: String!
    index: Int!
  }

  input DocumentTranslationInput {
    id: ID
    languageCode: LanguageCode!
    title: String!
    items: [DocumentItemInput!]!
  }

  input CreateDocumentInput {
    code: String!
    translations: [DocumentTranslationInput!]!
    active: Boolean!
    customFields: JSON
  }

  input UpdateDocumentInput {
    id: ID!
    code: String
    translations: [DocumentTranslationInput!]
    active: Boolean
    customFields: JSON
  }

  input AssignDocumentsToChannelInput {
    documentIds: [ID!]!
    channelId: ID!
  }

  input RemoveDocumentsFromChannelInput {
    documentIds: [ID!]!
    channelId: ID!
  }

`;

const documentAdminOperations = gql`
  extend type Query {
    document(id: ID!): Document
    documents(options: DocumentListOptions): DocumentList!
  }

  extend type Mutation {
    createDocument(input: CreateDocumentInput!): Document!
    updateDocument(input: UpdateDocumentInput!): Document!
    deleteDocument(id: ID!): DeletionResponse!
    deleteDocuments(ids: [ID!]!): [DeletionResponse!]!
    assignDocumentsToChannel(input: AssignDocumentsToChannelInput!): [Document!]!
    removeDocumentsFromChannel(input: RemoveDocumentsFromChannelInput!): [Document!]!
  }
`;

export const documentAdminApiExtensions = gql`
  ${documentSchemaTypes}
  ${documentAdminOperations}
`;
