import gql from 'graphql-tag';

export const commonApiExtensions = gql`
    type LoyaltyWalletHistory {
        id: ID!
        points: Int!
        type: String!
        source: String
        orderId: ID
        balanceAfter: Int!
        createdAt: DateTime
        updatedAt: DateTime
    }

    type LoyaltyPointsSettings {
        pointsPerEuro: Int!
        maxRedeemablePoints: Int!
        couponCode: String!
        isEligible: Boolean!
    }
`;

export const shopApiExtensions = gql`
    ${commonApiExtensions}
    extend type Query {
        getLoyaltyPointsSettings: LoyaltyPointsSettings!
    }
`;

export const adminApiExtensions = gql`
    ${commonApiExtensions}
`;
