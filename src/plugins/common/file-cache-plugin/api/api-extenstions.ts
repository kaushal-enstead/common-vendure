import gql from 'graphql-tag';

const fileCacheAdminApiExtensions = gql`
  enum FileCacheType {
    TEXT
    JSON
  }

  type FileCache implements Node {
    id: ID!
    value: String!
    type: FileCacheType!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type FileCacheList implements PaginatedList {
    items: [FileCache!]!
    totalItems: Int!
  }

  input FileCacheListOptions

  extend type Query {
    fileCacheEntries(options: FileCacheListOptions): FileCacheList!
    fileCacheEntry(id: ID!): FileCache
  }

  input CreateFileCacheInput {
    id: ID!
    value: String!
    type: FileCacheType!
  }

  input UpdateFileCacheInput {
    id: ID!
    value: String!
  }

  extend type Mutation {
    createFileCache(input: CreateFileCacheInput!): FileCache!
    updateFileCache(input: UpdateFileCacheInput!): FileCache!
    deleteFileCache(ids: [ID!]!): [DeletionResponse!]!
  }
`;

export const adminApiExtensions = gql`
  ${fileCacheAdminApiExtensions}
`;
