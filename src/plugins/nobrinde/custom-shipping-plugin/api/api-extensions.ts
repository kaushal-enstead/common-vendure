import gql from 'graphql-tag';

// Shared: adds a dynamic `zone` field to OrderAddress in both APIs.
const orderAddressZoneExtension = gql`
    extend type OrderAddress {
        zone: Zone
    }
`;

export const shopApiExtensions = orderAddressZoneExtension;

export const adminApiExtensions = gql`
    ${orderAddressZoneExtension}

    # Input used by the admin to set a manual shipping quote for out-of-Europe orders.
    input CustomSetShippingQuoteInput {
        orderId: ID!

        # Amount in the smallest currency unit (e.g. cents for EUR).
        shippingAmountWithTax: Int!

        # When true (default) an email notification is sent to the customer.
        notifyCustomer: Boolean = true
    }

    type CustomShippingQuoteState {
        orderId: ID!

        # One of: NOT_REQUIRED | PENDING | READY
        status: String!

        # Destination bucket resolved from the shipping address.
        # One of: PT_CONTINENTAL | PT_ISLANDS | SPAIN | FRANCE | EUROPE | OUT_OF_EUROPE
        destination: String

        # Quote amount in the smallest currency unit (cents). Null until set by admin.
        shippingAmountWithTax: Int

        currencyCode: String!
    }

    extend type Query {
        # Returns the current shipping quote state for the given order.
        customShippingQuoteState(orderId: ID!): CustomShippingQuoteState!
    }

    extend type Mutation {
        # Admin sets a manual shipping quote for an out-of-Europe order.
        # Optionally notifies the customer by email.
        customSetShippingQuote(input: CustomSetShippingQuoteInput!): Order!
    }
`;
