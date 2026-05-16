import gql from 'graphql-tag';

const shopApiExtensions = gql`
    extend type Product {
        isFavorite: Boolean!
        seller: Seller!
        # campaignProduct: CampaignProducts
        averageRating: Float
        reviewCount: Int
    }

    extend type SearchResult {
        isFavorite: Boolean
    }

    # input ProductListOptions
    input ProductFilterParameter {
        facetValueIds: StringOperators
        sellerId: ID
    }

    # type ProductList implements PaginatedList {
    #   items: [Product!]!
    #   totalItems: Int!
    # }

    # type ProductVariantList implements PaginatedList {
    #   items: [ProductVariant!]!
    #   totalItems: Int!
    # }

    input ProductVariantFilterParameter {
        facetValueIds: StringOperators
        sellerId: ID
        featuredProduct: BooleanOperators
    }

    extend type Query {
        searchProducts(options: ProductListOptions): ProductList!
        searchVariants(options: ProductVariantListOptions): ProductVariantList!
    }
`;

export { shopApiExtensions };
