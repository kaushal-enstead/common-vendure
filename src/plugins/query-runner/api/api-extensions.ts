import { gql } from 'graphql-tag';

export const adminApiExtensions = gql`
  type QueryResult {
    columns: [String!]!
    rows: [JSON!]!
    rowCount: Int!
    executionTime: Int!
    error: String
  }

  extend type Mutation {
    "Execute a SQL query (SELECT, INSERT, UPDATE, DELETE, CREATE, SHOW, TRUNCATE, ALTER)"
    executeQuery(query: String!): QueryResult!
  }
`;
