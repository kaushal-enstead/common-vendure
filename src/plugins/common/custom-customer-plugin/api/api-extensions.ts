import gql from 'graphql-tag';

export const shopApiExtensions = gql`
    extend type Mutation {
        deleteCustomerAccount: Boolean!
        registerCustomerAccountWithAddress(
            input: RegisterCustomerInput!
            address: CreateAddressInput!
        ): RegisterCustomerAccountResult!
    }
`;
