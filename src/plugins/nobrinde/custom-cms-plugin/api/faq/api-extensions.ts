import gql from 'graphql-tag';

export const faqSchemaTypes = gql`
  type FaqItem {
    question: String!
    explanation: String!
    index: Int!
  }

  type FaqTranslation {
    id: ID!
    languageCode: LanguageCode!
    title: String!
    items: [FaqItem!]!
  }

  type Faq implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    code: String!
    title: String!
    items: [FaqItem!]!
    active: Boolean!
    customFields: JSON
    translations: [FaqTranslation!]!
    channels: [Channel!]!
  }

  type FaqList implements PaginatedList {
    items: [Faq!]!
    totalItems: Int!
  }

  # Generated at run-time by Vendure
  input FaqListOptions

  input FaqItemInput {
    question: String!
    explanation: String!
    index: Int!
  }

  input FaqTranslationInput {
    id: ID
    languageCode: LanguageCode!
    title: String!
    items: [FaqItemInput!]!
  }

  input CreateFaqInput {
    code: String!
    translations: [FaqTranslationInput!]!
    active: Boolean!
    customFields: JSON
  }

  input UpdateFaqInput {
    id: ID!
    code: String
    translations: [FaqTranslationInput!]
    active: Boolean
    customFields: JSON
  }

  input AssignFaqsToChannelInput {
    faqIds: [ID!]!
    channelId: ID!
  }

  input RemoveFaqsFromChannelInput {
    faqIds: [ID!]!
    channelId: ID!
  }
`;

const faqAdminOperations = gql`
  extend type Query {
    faq(id: ID!): Faq
    faqs(options: FaqListOptions): FaqList!
  }

  extend type Mutation {
    createFaq(input: CreateFaqInput!): Faq!
    updateFaq(input: UpdateFaqInput!): Faq!
    deleteFaq(id: ID!): DeletionResponse!
    deleteFaqs(ids: [ID!]!): [DeletionResponse!]!
    assignFaqsToChannel(input: AssignFaqsToChannelInput!): [Faq!]!
    removeFaqsFromChannel(input: RemoveFaqsFromChannelInput!): [Faq!]!
  }
`;

export const faqAdminApiExtensions = gql`
  ${faqSchemaTypes}
  ${faqAdminOperations}
`;
