import { gql } from 'graphql-tag';

export const adminApiExtensions = gql`
  extend type Mutation {
    generateProductQrCode(productId: ID!): Boolean!
    generateProductAndVariantsQrCodes(productId: ID!): Boolean!
  }
`;
