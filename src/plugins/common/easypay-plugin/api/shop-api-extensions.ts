import gql from 'graphql-tag';

export const shopApiExtensions = gql`
  extend type Mutation {
    createEasypayCheckout(orderId: ID!): EasypayCheckoutResult!
    cancelEasypayCheckout(checkoutId: ID!): Boolean!
  }

  type EasypayCheckoutResult {
    session: String!
    id: String!
    config: JSON
  }
`;
