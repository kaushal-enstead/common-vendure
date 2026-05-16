import gql from 'graphql-tag';

export const authorSchemaTypes = gql`
  type AuthorTranslation {
    id: ID!
    languageCode: LanguageCode!
    title: String!
  }

  type Author implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    name: String!
    logo: String
    title: String!
    active: Boolean!
    customFields: JSON
    translations: [AuthorTranslation!]!
    channels: [Channel!]!
  }

  type AuthorList implements PaginatedList {
    items: [Author!]!
    totalItems: Int!
  }

  # Generated at run-time by Vendure
  input AuthorListOptions

  input AuthorTranslationInput {
    id: ID
    languageCode: LanguageCode!
    title: String!
  }

  input CreateAuthorInput {
    name: String!
    logo: String
    translations: [AuthorTranslationInput!]!
    active: Boolean!
    customFields: JSON
  }

  input UpdateAuthorInput {
    id: ID!
    name: String
    logo: String
    translations: [AuthorTranslationInput!]
    active: Boolean
    customFields: JSON
  }

  input AssignAuthorsToChannelInput {
    authorIds: [ID!]!
    channelId: ID!
  }

  input RemoveAuthorsFromChannelInput {
    authorIds: [ID!]!
    channelId: ID!
  }
`;

const authorAdminOperations = gql`
  extend type Query {
    author(id: ID!): Author
    authors(options: AuthorListOptions): AuthorList!
  }

  extend type Mutation {
    createAuthor(input: CreateAuthorInput!): Author!
    updateAuthor(input: UpdateAuthorInput!): Author!
    deleteAuthor(id: ID!): DeletionResponse!
    deleteAuthors(ids: [ID!]!): [DeletionResponse!]!
    assignAuthorsToChannel(input: AssignAuthorsToChannelInput!): [Author!]!
    removeAuthorsFromChannel(input: RemoveAuthorsFromChannelInput!): [Author!]!
  }
`;

export const authorAdminApiExtensions = gql`
  ${authorSchemaTypes}
  ${authorAdminOperations}
`;
