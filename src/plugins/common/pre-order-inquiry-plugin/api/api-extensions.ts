import gql from 'graphql-tag';

const commonAPIExtensions = gql`
    enum EPreOrderStatus {
        PENDING
        ACCEPTED
        CUSTOMER_ACCEPTED
        REFUSED
        CHANGE_PROPOSED
        COMPLETED
    }

    type PreOrder implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        status: EPreOrderStatus!
        productVariant: ProductVariant!
        quantity: Float!
        customer: Customer
        deletedAt: DateTime
        acceptedAt: DateTime
        message: String
    }

    type PreOrderList implements PaginatedList {
        items: [PreOrder!]!
        totalItems: Int!
    }

    input PreOrderListOptions
`;

const preOrderAdminApiExtensions = gql`
    ${commonAPIExtensions}

    extend type Query {
        preOrder(id: ID!): PreOrder
        preOrders(options: PreOrderListOptions): PreOrderList!
    }

    input CreatePreOrderInput {
        productVariantId: ID!
        quantity: Float!
        customerId: ID
        message: String
    }

    input UpdatePreOrderInput {
        id: ID!
        productVariantId: ID
        quantity: Float
        customerId: ID
        message: String
        status: EPreOrderStatus
    }

    extend type Mutation {
        createPreOrder(input: CreatePreOrderInput!): PreOrder!
        updatePreOrder(input: UpdatePreOrderInput!): PreOrder!
        acceptPreOrder(id: ID!): Boolean
        acceptMultiplePreOrders(preOrderIds: [ID!]!): Boolean
        cancelPreOrder(id: ID!): Boolean
    }
`;

const preOrderShopApiExtensions = gql`
    ${commonAPIExtensions}

    input CreatePreOrderInput {
        productVariantId: ID!
        quantity: Float!
    }

    extend type Query {
        myPreOrders(options: PreOrderListOptions): PreOrderList!
    }

    extend type Mutation {
        cancelPreOrder(id: ID!): Boolean
        createPreOrder(input: CreatePreOrderInput!): PreOrder!
        convertToOrder(id: ID!): Order!
    }
`;

export const adminApiExtensions = gql`
    ${preOrderAdminApiExtensions}
`;

export const shopApiExtensions = gql`
    ${preOrderShopApiExtensions}
`;
