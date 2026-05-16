import { assetFragment } from '@vendure/dashboard';
import { graphql } from '@/gql';

export const kitListDocument = graphql(`
  query KitList($options: KitListOptions) {
    kits(options: $options) {
      items {
        id
        createdAt
        updatedAt
        type
        featuredAsset {
          id
          preview
        }
        variants {
          id
          quantity
          discount
          productVariant {
            price
            priceWithTax
            currencyCode
          }
        }
        name
        slug
        enabled
        description
      }
      totalItems
    }
  }
`);

export const kitDetailFragment = graphql(
  `
    fragment KitDetail on Kit {
      id
      createdAt
      updatedAt
      enabled
      type
      name
      slug
      description
      featuredAsset {
        ...Asset
      }
      assets {
        ...Asset
      }
      translations {
        id
        languageCode
        name
        slug
        description
      }
      facetValues {
        id
        name
        code
        facet {
          id
          name
          code
        }
      }
    }
  `,
  [assetFragment],
);

export const kitVariantListDocument = graphql(
  `
    query KitVariantList($options: KitVariantListOptions, $kitId: ID) {
      kitVariants(options: $options, kitId: $kitId) {
        items {
          id
          createdAt
          updatedAt
          productVariantId
          quantity
          discount
          productVariant {
            featuredAsset {
              ...Asset
            }
            name
            sku
            enabled
            currencyCode
            price
            priceWithTax
            stockLevels {
              stockOnHand
              stockAllocated
            }
          }
        }
        totalItems
      }
    }
  `,
  [assetFragment],
);

export const kitDetailDocument = graphql(
  `
    query KitDetail($id: ID!) {
      kit(id: $id) {
        ...KitDetail
        variantList {
          totalItems
        }
      }
    }
  `,
  [kitDetailFragment],
);

export const kitDetailWithVariantsDocument = graphql(
  `
    query KitDetailWithVariants($id: ID!) {
      kit(id: $id) {
        id
        createdAt
        updatedAt
        name
        type
        variantList {
          totalItems
        }
        variants {
          id
          quantity
          discount
          productVariant {
            name
            sku
            price
            featuredAsset {
              ...Asset
            }
            currencyCode
            priceWithTax
            createdAt
            updatedAt
          }
        }
      }
    }
  `,
  [assetFragment],
);

export const createKitDocument = graphql(`
  mutation CreateKit($input: CreateKitInput!) {
    createKit(input: $input) {
      id
    }
  }
`);

export const updateKitDocument = graphql(`
  mutation UpdateKit($input: UpdateKitInput!) {
    updateKit(input: $input) {
      id
    }
  }
`);

export const deleteKitDocument = graphql(`
  mutation DeleteKit($id: ID!) {
    deleteKit(id: $id) {
      result
      message
    }
  }
`);

export const deleteKitsDocument = graphql(`
  mutation DeleteKits($ids: [ID!]!) {
    deleteKits(ids: $ids) {
      result
      message
    }
  }
`);

export const assignKitsToChannelDocument = graphql(`
  mutation AssignKitsToChannel($input: AssignKitsToChannelInput!) {
    assignKitsToChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

export const removeKitsFromChannelDocument = graphql(`
  mutation RemoveKitsFromChannel($input: RemoveKitsFromChannelInput!) {
    removeKitsFromChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

export const updateKitsDocument = graphql(`
  mutation UpdateKits($input: [UpdateKitInput!]!) {
    updateKits(input: $input) {
      id
      name
      facetValues {
        id
        name
        code
      }
    }
  }
`);

export const getKitsWithFacetValuesByIdsDocument = graphql(`
  query GetKitsWithFacetValuesByIds($ids: [String!]!) {
    kits(options: { filter: { id: { in: $ids } } }) {
      items {
        id
        name
        facetValues {
          id
          name
          code
          facet {
            id
            name
            code
          }
        }
      }
    }
  }
`);

export const updateKitVariantDocument = graphql(`
  mutation UpdateKitVariant($input: UpdateKitVariantInput!) {
    updateKitVariant(input: $input) {
      id
      quantity
      discount
    }
  }
`);

export const updateKitVariantsDocument = graphql(`
  mutation UpdateKitVariants($input: [UpdateKitVariantInput!]!) {
    updateKitVariants(input: $input) {
      id
      quantity
      discount
    }
  }
`);

export const deleteKitVariantDocument = graphql(`
  mutation DeleteKitVariant($id: ID!) {
    deleteKitVariant(id: $id) {
      result
      message
    }
  }
`);

export const createKitVariantsDocument = graphql(`
  mutation CreateKitVariants($input: [CreateKitVariantInput!]!) {
    createKitVariants(input: $input) {
      id
    }
  }
`);

export const createKitVariantDocument = graphql(`
  mutation CreateKitVariant($input: CreateKitVariantInput!) {
    createKitVariant(input: $input) {
      id
      quantity
      discount
    }
  }
`);
