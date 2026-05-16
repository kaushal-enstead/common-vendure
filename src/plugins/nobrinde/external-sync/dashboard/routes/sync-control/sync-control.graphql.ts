import { graphql } from '@/gql';

export const syncTableListDocument = graphql(`
  query GetSyncTables($options: SyncTableListOptions) {
    syncTables(options: $options) {
      items {
        id
        createdAt
        updatedAt
        tableName
        lastSyncedAt
      }
      totalItems
    }
  }
`);

export const syncTableDetailDocument = graphql(`
  query GetSyncTable($id: ID!) {
    syncTable(id: $id) {
      id
      createdAt
      updatedAt
      tableName
      lastSyncedAt
    }
  }
`);

export const updateSyncTableDocument = graphql(`
  mutation UpdateSyncTable($input: UpdateSyncTableInput!) {
    updateSyncTable(input: $input) {
      id
      tableName
      lastSyncedAt
    }
  }
`);

export const runProductSyncDocument = graphql(`
  mutation RunProductSync($productIds: [ID!]!) {
    runProductSync(productIds: $productIds)
  }
`);

export const runVariantSyncDocument = graphql(`
  mutation RunVariantSync($variantIds: [ID!]!) {
    runVariantSync(variantIds: $variantIds)
  }
`);

export const runCollectionSyncDocument = graphql(`
  mutation RunCollectionSync($collectionIds: [ID!]!) {
    runCollectionSync(collectionIds: $collectionIds)
  }
`);

export const runFacetSyncDocument = graphql(`
  mutation RunFacetSync($facetIds: [ID!]!) {
    runFacetSync(facetIds: $facetIds)
  }
`);

export const runCustomerSyncDocument = graphql(`
  mutation RunCustomerSync($customerIds: [ID!]!) {
    runCustomerSync(customerIds: $customerIds)
  }
`);

export const runNobrindeBudgetSyncDocument = graphql(`
  mutation RunNobrindeBudgetSync($budgetIds: [ID!]!) {
    runNobrindeBudgetSync(budgetIds: $budgetIds)
  }
`);

export const runNobrindeOrderSyncDocument = graphql(`
  mutation RunNobrindeOrderSync($orderIds: [ID!]!) {
    runNobrindeOrderSync(orderIds: $orderIds)
  }
`);

export const runNobrindeSaleUserSyncDocument = graphql(`
  mutation RunNobrindeSaleUserSync($saleUserIds: [ID!]!) {
    runNobrindeSaleUserSync(saleUserIds: $saleUserIds)
  }
`);

export const runNobrindeChannelSyncDocument = graphql(`
  mutation RunNobrindeChannelSync($channelIds: [ID!]!) {
    runNobrindeChannelSync(channelIds: $channelIds)
  }
`);
