import { graphql } from '@/gql';

export const getReviewsDocument = graphql(`
    query GetReviews($options: ReviewListOptions) {
        reviews(options: $options) {
            averageRating
            totalItems
            items {
                id
                type
                createdAt
                updatedAt
                comment
                rating
                public
                seller {
                    id
                    name
                    customFields {
                        logo {
                            id
                            preview
                        }
                    }
                }
                booking {
                    id
                    name
                    featuredAsset {
                        id
                        preview
                    }
                }
                product {
                    id
                    name
                    featuredAsset {
                        id
                        preview
                    }
                }
                customer {
                    id
                    title
                    firstName
                    lastName
                }
            }
        }
    }
`);

export const getReviewDocument = graphql(`
    query GetReview($id: ID!) {
        review(id: $id) {
            id
            type
            createdAt
            updatedAt
            comment
            rating
            public
            seller {
                id
                name
                customFields {
                    logo {
                        id
                        preview
                    }
                }
            }
            booking {
                id
                name
                featuredAsset {
                    id
                    preview
                }
            }
            product {
                id
                name
                featuredAsset {
                    id
                    preview
                }
            }
            customer {
                id
                title
                firstName
                lastName
            }
        }
    }
`);

export const updateReviewDocument = graphql(`
    mutation UpdateReview($input: UpdateReviewInput!) {
        updateReview(input: $input) {
            id
            comment
            public
            createdAt
            updatedAt
            rating
        }
    }
`);

export const deleteReviewDocument = graphql(`
    mutation DeleteReview($id: ID!) {
        deleteReview(id: $id) {
            result
            message
        }
    }
`);

export const deleteReviewsDocument = graphql(`
    mutation DeleteReviews($ids: [ID!]) {
        deleteReviews(ids: $ids) {
            message
            result
        }
    }
`);
