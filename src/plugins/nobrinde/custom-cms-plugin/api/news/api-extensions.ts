import gql from 'graphql-tag';

export const newsSchemaTypes = gql`
  type NewsSeo {
    title: String!
    image: String!
    description: String!
  }

  type NewsTranslation {
    id: ID!
    languageCode: LanguageCode!
    title: String!
    description: String!
  }

  type News implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    title: String!
    description: String!
    src: String
    authorId: ID
    author: Author
    relatedNewsIds: [ID!]!
    relatedNews: [News!]!
    seo: NewsSeo
    categoryId: ID
    category: Category
    customFields: JSON
    translations: [NewsTranslation!]!
    channels: [Channel!]!
  }

  type NewsList implements PaginatedList {
    items: [News!]!
    totalItems: Int!
  }

  # Generated at run-time by Vendure
  input NewsListOptions

  input NewsSeoInput {
    title: String!
    image: String!
    description: String!
  }

  input NewsTranslationInput {
    id: ID
    languageCode: LanguageCode!
    title: String!
    description: String!
  }

  input CreateNewsInput {
    translations: [NewsTranslationInput!]!
    src: String
    authorId: ID
    relatedNewsIds: [ID!]
    seo: NewsSeoInput
    categoryId: ID
    customFields: JSON
  }

  input UpdateNewsInput {
    id: ID!
    translations: [NewsTranslationInput!]
    src: String
    authorId: ID
    relatedNewsIds: [ID!]
    seo: NewsSeoInput
    categoryId: ID
    customFields: JSON
  }

  input AssignNewsToChannelInput {
    newsIds: [ID!]!
    channelId: ID!
  }

  input RemoveNewsFromChannelInput {
    newsIds: [ID!]!
    channelId: ID!
  }
`;

const newsAdminOperations = gql`
  extend type Query {
    news(id: ID!): News
    newsList(options: NewsListOptions): NewsList!
  }

  extend type Mutation {
    createNews(input: CreateNewsInput!): News!
    updateNews(input: UpdateNewsInput!): News!
    deleteNews(id: ID!): DeletionResponse!
    deleteNewsList(ids: [ID!]!): [DeletionResponse!]!
    assignNewsToChannel(input: AssignNewsToChannelInput!): [News!]!
    removeNewsFromChannel(input: RemoveNewsFromChannelInput!): [News!]!
  }
`;

export const newsAdminApiExtensions = gql`
  ${newsSchemaTypes}
  ${newsAdminOperations}
`;
