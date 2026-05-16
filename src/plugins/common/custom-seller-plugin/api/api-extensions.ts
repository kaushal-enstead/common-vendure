import gql from 'graphql-tag';

const shopApiExtensions = gql`
    extend type Seller {
        collection: Collection
        isFavorite: Boolean!
        serviceCount: Int
        variantCount: Int
        productCount: Int
        averageRating: Float
        reviewCount: Int
        shopDescription: String
        privacyPolicy: String
        shippingPolicy: String
        returnPolicy: String
    }

    input SellerListOptions
    input SellerFilterParameter {
        facetValueIds: StringOperators
    }

    type SellerList implements PaginatedList {
        items: [Seller!]!
        totalItems: Int!
    }

    extend type Query {
        sellers(options: SellerListOptions): SellerList!
        seller(id: ID!): Seller!
    }

    extend type Mutation {
        sellerLogin(email: String!, password: String!): NativeAuthenticationResult!
    }
`;

const adminApiExtensions = gql`
    extend type Mutation {
        sellerLogin(email: String!, password: String!): NativeAuthenticationResult!
        rejectSeller(sellerId: String!, reason: String!): Boolean!
        approveSeller(sellerId: String!): Boolean!
    }
`;

export { adminApiExtensions, shopApiExtensions };
