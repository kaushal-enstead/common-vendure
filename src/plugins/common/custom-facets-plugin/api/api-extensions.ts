import gql from 'graphql-tag';

const shopApiExtensions = gql`
    extend type Query {
        facetsList(type: String!, parentId: ID!): [Facet!]!
    }
`;

export { shopApiExtensions };
