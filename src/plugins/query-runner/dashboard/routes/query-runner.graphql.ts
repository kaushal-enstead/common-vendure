import { graphql } from '@/gql';

export const executeQueryDocument = graphql(`
  mutation ExecuteQuery($query: String!) {
    executeQuery(query: $query) {
      columns
      rows
      rowCount
      executionTime
      error
    }
  }
`);
