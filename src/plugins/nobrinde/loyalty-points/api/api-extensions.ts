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

  type LoyaltySettings {
    pointsPerEuro: Int
    maxRedeemablePoints: Int
    enableLoyaltyDiscount: Boolean
    loyaltyDiscount: Int
  }

  input LoyaltySettingsInput {
    pointsPerEuro: Int
    maxRedeemablePoints: Int
    enableLoyaltyDiscount: Boolean
    loyaltyDiscount: Int
  }

  type LoyaltyPointSettings {
    pointsPerEuro: Int!
    maxRedeemablePoints: Int!
    couponCode: String!
    isEligible: Boolean!
  }
`;

export const shopApiExtensions = gql`
  ${commonApiExtensions}

  extend type Query {
    getLoyaltyPointSettings: LoyaltyPointSettings!
  }
`;

export const adminApiExtensions = gql`
  ${commonApiExtensions}

  type TreeItem {
    id: ID!
    name: String!
  }

  type Tree {
    id: ID!
    name: String!
    children: [TreeItem]!
  }

  input AllocateLoyaltyPointsInput {
    points: Int!
    customerIds: [ID!]!
  }

  extend type Query {
    getLoyaltySettings: LoyaltySettings
    getCustomerGroups(search: String, limit: Int): [Tree]!
  }

  extend type Mutation {
    updateLoyaltySettings(input: LoyaltySettingsInput!): LoyaltySettings!
    allocateLoyaltyPoints(input: AllocateLoyaltyPointsInput!): Boolean
  }
`;
