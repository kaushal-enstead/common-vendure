import { graphql } from '@/gql';

export const getPreOrdersDocument = graphql(`
    query DashboardGetPreOrders($options: PreOrderListOptions) {
        preOrders(options: $options) {
            items {
                id
                status
                productVariant {
                    id
                    name
                    priceWithTax
                    currencyCode
                    stockLevel
                    featuredAsset {
                        id
                        preview
                    }
                    product {
                        id
                        name
                        featuredAsset {
                            id
                            preview
                        }
                    }
                }
                quantity
                customer {
                    id
                    title
                    firstName
                    lastName
                }
                createdAt
                acceptedAt
                deletedAt
                message
            }
            totalItems
        }
    }
`);

export const getPreOrderDocument = graphql(`
    query DashboardGetPreOrder($id: ID!) {
        preOrder(id: $id) {
            id
            productVariant {
                id
                name
                priceWithTax
                currencyCode
                stockLevel
                featuredAsset {
                    id
                    preview
                }
                product {
                    id
                    name
                    featuredAsset {
                        id
                        preview
                    }
                }
            }
            quantity
            customer {
                id
                title
                firstName
                lastName
            }
            createdAt
            acceptedAt
            deletedAt
            message
            status
        }
    }
`);

export const updatePreOrderDocument = graphql(`
    mutation DashboardUpdatePreOrder($input: UpdatePreOrderInput!) {
        updatePreOrder(input: $input) {
            id
        }
    }
`);

export const acceptMultiplePreOrdersDocument = graphql(`
    mutation DashboardAcceptMultiplePreOrders($ids: [ID!]!) {
        acceptMultiplePreOrders(preOrderIds: $ids)
    }
`);
