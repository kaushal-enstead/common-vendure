import { gql } from 'graphql-tag';

export const syncTableApiExtensions = gql`
  type SyncTable implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    tableName: String!
    lastSyncedAt: DateTime
  }

  type SyncTableList implements PaginatedList {
    items: [SyncTable!]!
    totalItems: Int!
  }

  input SyncTableListOptions

  input UpdateSyncTableInput {
    id: ID!
    lastSyncedAt: DateTime
  }

  extend type Query {
    syncTables(options: SyncTableListOptions): SyncTableList!
    syncTable(id: ID!): SyncTable
  }

  extend type Mutation {
    updateSyncTable(input: UpdateSyncTableInput!): SyncTable!
  }
`;

export const nobrindeChannelApiExtensions = gql`
  extend type Query {
    availableNobrindeChannels(currentChannelId: ID, options: NobrindeChannelListOptions): NobrindeChannelList!
  }
`;

export const syncApiExtensions = gql`
  extend type Query {
    """
    Grouped (bundle) parent product that lists the child SKU in customFields.grouped_child_skus, if any.
    """
    groupedParentProduct(childSku: String!): Product
  }

  extend type Mutation {
    runProductSync(productIds: [ID!]!): Boolean!
    runVariantSync(variantIds: [ID!]!): Boolean!
    runCollectionSync(collectionIds: [ID!]!): Boolean!
    runFacetSync(facetIds: [ID!]!): Boolean!
    runCustomerSync(customerIds: [ID!]!): Boolean!
    runNobrindeBudgetSync(budgetIds: [ID!]!): Boolean!
    runNobrindeOrderSync(orderIds: [ID!]!): Boolean!
    runNobrindeSaleUserSync(saleUserIds: [ID!]!): Boolean!
    runNobrindeChannelSync(channelIds: [ID!]!): Boolean!
  }
`;

export const apiExtensions = gql`
  ${syncTableApiExtensions}
  ${nobrindeChannelApiExtensions}
  ${syncApiExtensions}
`;
