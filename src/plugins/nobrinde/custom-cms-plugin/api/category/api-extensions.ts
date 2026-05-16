import gql from 'graphql-tag';

/** Core types + mutation inputs (admin + shop). CategoryList* is admin-only. */
export const categorySchemaTypes = gql`
  enum CategoryType {
    news
    authors
    faq
  }

  type Category implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    name: String!
    description: String
    type: CategoryType!
    active: Boolean!
    customFields: JSON
    channels: [Channel!]!
  }

  input CreateCategoryInput {
    name: String!
    description: String
    type: CategoryType!
    active: Boolean!
    customFields: JSON
  }

  input UpdateCategoryInput {
    id: ID!
    name: String
    description: String
    type: CategoryType
    active: Boolean
    customFields: JSON
  }

  input AssignCategoriesToChannelInput {
    categoryIds: [ID!]!
    channelId: ID!
  }

  input RemoveCategoriesFromChannelInput {
    categoryIds: [ID!]!
    channelId: ID!
  }
`;

const categoryAdminListTypes = gql`
  type CategoryList implements PaginatedList {
    items: [Category!]!
    totalItems: Int!
  }

  # Generated at run-time by Vendure
  input CategoryListOptions
`;

const categoryAdminOperations = gql`
  extend type Query {
    category(id: ID!): Category
    categories(options: CategoryListOptions): CategoryList!
  }

  extend type Mutation {
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): DeletionResponse!
    deleteCategories(ids: [ID!]!): [DeletionResponse!]!
    assignCategoriesToChannel(input: AssignCategoriesToChannelInput!): [Category!]!
    removeCategoriesFromChannel(input: RemoveCategoriesFromChannelInput!): [Category!]!
  }
`;

export const categoryAdminApiExtensions = gql`
  ${categorySchemaTypes}
  ${categoryAdminListTypes}
  ${categoryAdminOperations}
`;
