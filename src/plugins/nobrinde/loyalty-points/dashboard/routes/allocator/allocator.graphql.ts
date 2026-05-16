import { graphql } from '@/gql';

const getCustomerGroups = graphql(`
  query GetCustomerGroups {
    getCustomerGroups {
      id
      name
      children {
        id
        name
      }
    }
  }
`);

const allocateLoyaltyPoints = graphql(`
  mutation AllocateLoyaltyPoints($input: AllocateLoyaltyPointsInput!) {
    allocateLoyaltyPoints(input: $input)
  }
`);

export { getCustomerGroups, allocateLoyaltyPoints };
