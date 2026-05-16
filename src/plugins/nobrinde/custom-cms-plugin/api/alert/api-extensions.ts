import gql from 'graphql-tag';

const alertApiExtensions = gql`
  type AlertButton {
    label: String!
    type: String!
    openInNewTab: Boolean!
    url: String
    linkRef: JSON
  }

  type AlertTranslation {
    id: ID!
    languageCode: LanguageCode!
    title: String!
    content: String!
    targetUrls: [String!]!
    button: AlertButton
  }

  type Alert implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    code: String!
    title: String!
    assetId: String
    asset: Asset
    content: String!
    targetUrls: [String!]!
    button: AlertButton
    active: Boolean!
    customFields: JSON
    translations: [AlertTranslation!]!
    channels: [Channel!]!
  }

  type AlertList implements PaginatedList {
    items: [Alert!]!
    totalItems: Int!
  }

  # Generated at run-time by Vendure
  input AlertListOptions

  type LinkRefOption {
    entity: String!
    label: String!
    value: ID!
  }

  type LinkRefOptions {
    page: [LinkRefOption!]!
    author: [LinkRefOption!]!
    document: [LinkRefOption!]!
  }

  extend type Query {
    alert(id: ID!): Alert
    alerts(options: AlertListOptions): AlertList!
    linkRefOptions: LinkRefOptions!
  }

  input AlertButtonInput {
    label: String!
    type: String!
    openInNewTab: Boolean!
    url: String
    linkRef: JSON
  }

  input AlertTranslationInput {
    id: ID
    languageCode: LanguageCode!
    title: String!
    content: String!
    targetUrls: [String!]!
    button: AlertButtonInput
  }

  input CreateAlertInput {
    code: String!
    assetId: ID
    translations: [AlertTranslationInput!]!
    active: Boolean!
    customFields: JSON
  }

  input UpdateAlertInput {
    id: ID!
    code: String
    assetId: ID
    translations: [AlertTranslationInput!]
    active: Boolean
    customFields: JSON
  }

  input AssignAlertsToChannelInput {
    alertIds: [ID!]!
    channelId: ID!
  }

  input RemoveAlertsFromChannelInput {
    alertIds: [ID!]!
    channelId: ID!
  }

  extend type Mutation {
    createAlert(input: CreateAlertInput!): Alert!
    updateAlert(input: UpdateAlertInput!): Alert!
    deleteAlert(id: ID!): DeletionResponse!
    deleteAlerts(ids: [ID!]!): [DeletionResponse!]!
    assignAlertsToChannel(input: AssignAlertsToChannelInput!): [Alert!]!
    removeAlertsFromChannel(input: RemoveAlertsFromChannelInput!): [Alert!]!
  }
`;

export const alertAdminApiExtensions = gql`
  ${alertApiExtensions}
`;
