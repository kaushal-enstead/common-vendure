import { gql } from 'graphql-tag';

export const supportSubject = gql`
  type SupportSubject implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    code: String!
    isActive: Boolean!
    name: String!
    description: String!
    translations: [SupportSubjectTranslation!]!
  }

  type SupportSubjectTranslation {
    id: ID!
    languageCode: LanguageCode!
    name: String!
    description: String!
  }

  input CreateSupportSubjectInput {
    code: String!
    isActive: Boolean
    translations: [SupportSubjectTranslationInput!]!
  }

  input UpdateSupportSubjectInput {
    id: ID!
    code: String
    isActive: Boolean
    translations: [SupportSubjectTranslationInput!]
  }

  input SupportSubjectTranslationInput {
    id: ID
    languageCode: LanguageCode!
    name: String!
    description: String!
  }

  type SupportSubjectList implements PaginatedList {
    items: [SupportSubject!]!
    totalItems: Int!
  }
`;

export const supportTicket = gql`
  type SupportTicket implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    description: String!
    status: SupportTicketStatus!
    priority: SupportTicketPriority!
    customer: Customer
    customerId: String!
    channel: Channel
    channelId: String!
    subject: SupportSubject
    subjectId: String!
    messages: [SupportTicketMessage!]!
  }

  type SupportTicketMessage {
    id: String!
    content: String!
    sender: SupportTicketSender!
    senderId: String!
    timestamp: DateTime!
    ticketId: String!
  }

  enum SupportTicketStatus {
    OPEN
    CLOSED
    PENDING
  }

  enum SupportTicketPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  enum SupportTicketSender {
    CUSTOMER
    SELLER
  }

  input CreateSupportTicketInput {
    description: String!
    priority: SupportTicketPriority
    subjectId: String!
    channelId: String!
  }

  input UpdateSupportTicketInput {
    id: ID!
    description: String
    status: SupportTicketStatus
    priority: SupportTicketPriority
    subjectId: String
    channelId: String
  }

  input AddSupportTicketMessageInput {
    supportTicketId: ID!
    content: String!
  }

  input UpdateSupportTicketStatusInput {
    supportTicketId: ID!
    status: SupportTicketStatus!
  }

  type SupportTicketList implements PaginatedList {
    items: [SupportTicket!]!
    totalItems: Int!
  }
`;

export const adminApiExtensions = gql`
  ${supportSubject}
  ${supportTicket}

  # Generated at run-time by Vendure
  input SupportSubjectListOptions
  input SupportTicketListOptions

  extend type Query {
    supportSubjects(options: SupportSubjectListOptions): SupportSubjectList!
    supportSubject(id: ID!): SupportSubject
  }

  extend type Mutation {
    createSupportSubject(input: CreateSupportSubjectInput!): SupportSubject!
    updateSupportSubject(input: UpdateSupportSubjectInput!): SupportSubject!
    deleteSupportSubject(id: ID!): DeletionResponse!
    deleteSupportSubjects(ids: [ID!]!): DeletionResponse!
  }

  extend type Query {
    supportTickets(options: SupportTicketListOptions): SupportTicketList!
    supportTicket(id: ID!): SupportTicket
  }

  extend type Mutation {
    updateSupportTicket(input: UpdateSupportTicketInput!): SupportTicket!
    deleteSupportTicket(id: ID!): DeletionResponse!
    deleteSupportTickets(ids: [ID!]!): DeletionResponse!

    addSupportTicketMessage(input: AddSupportTicketMessageInput!): SupportTicket!
    updateSupportTicketStatus(input: UpdateSupportTicketStatusInput!): SupportTicket!
  }
`;

export const shopApiExtensions = gql`
  ${supportSubject}
  ${supportTicket}

  # Generated at run-time by Vendure
  input SupportTicketListOptions
  input SupportSubjectListOptions

  extend type Query {
    supportSubjects(options: SupportSubjectListOptions): SupportSubjectList!
    mySupportTickets(options: SupportTicketListOptions): SupportTicketList!
  }

  extend type Mutation {
    createSupportTicket(input: CreateSupportTicketInput!): SupportTicket!
    addSupportTicketMessage(input: AddSupportTicketMessageInput!): SupportTicket!
  }
`;
