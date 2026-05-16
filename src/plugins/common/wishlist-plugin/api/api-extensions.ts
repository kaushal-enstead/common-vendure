import gql from 'graphql-tag';

export const shopApiExtensions = gql`
    enum WishlistItemType {
        SELLER
        PRODUCT
        BOOKING
    }

    type WishlistItem implements Node {
        id: ID!
        type: WishlistItemType!
        seller: Seller
        product: Product
        booking: Booking
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    type WishlistItemList implements PaginatedList {
        items: [WishlistItem!]!
        totalItems: Int!
    }

    input WishlistItemListOptions

    extend type Query {
        wishlist(options: WishlistItemListOptions): WishlistItemList!
    }

    extend type Mutation {
        addToWishlist(type: WishlistItemType!, itemId: ID!): WishlistItem!
        removeFromWishlist(type: WishlistItemType!, itemId: ID!): DeletionResponse!
    }
`;
