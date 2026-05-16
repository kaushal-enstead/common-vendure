import { graphql } from '@/gql';

export const approveSellerDocument = graphql(`
    mutation ApproveSellerDash($sellerId: String!) {
        approveSeller(sellerId: $sellerId)
    }
`);

export const rejectSellerDocument = graphql(`
    mutation RejectSellerDash($sellerId: String!, $reason: String!) {
        rejectSeller(sellerId: $sellerId, reason: $reason)
    }
`);

export const sellerCollectionsDocument = graphql(`
    query SellerCollectionsDash {
        collections(options: { take: 500 }) {
            items {
                id
                name
                slug
            }
        }
    }
`);

export const sellerFacetsCollectionsDocument = graphql(`
    query SellerFacetsCollectionsDash {
        facets(options: { take: 500 }) {
            items {
                id
                name
                values {
                    id
                    name
                }
            }
        }
        collections(options: { take: 500 }) {
            items {
                id
                name
                slug
            }
        }
    }
`);