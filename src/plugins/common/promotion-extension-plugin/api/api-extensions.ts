import gql from 'graphql-tag';

export const shopApiExtensions = gql`
    input PromotionListOptions

    extend type Query {
        promotion(id: ID!): Promotion
        promotions(options: PromotionListOptions): PromotionList!
    }
`;
