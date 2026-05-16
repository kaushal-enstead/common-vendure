import gql from 'graphql-tag';

export const adminApiExtensions = gql`
  extend type Mutation {
    cancelEasypayCheckout(checkoutId: String!): Boolean!
    createEasypayRefund(paymentId: String!): Boolean!
  }
`;
