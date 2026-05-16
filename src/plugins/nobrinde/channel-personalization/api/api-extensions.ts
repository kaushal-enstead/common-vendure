import { gql } from 'graphql-tag';

export const shopApiExtensions = gql`
  extend type Query {
    channelByDomain(domain: String!): Channel
  }
`;
