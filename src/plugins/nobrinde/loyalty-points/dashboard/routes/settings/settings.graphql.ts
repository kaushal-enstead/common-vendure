import { graphql } from '@/gql';

const loyaltySettingsFragment = graphql(`
  fragment LoyaltySettingsItem on LoyaltySettings {
    pointsPerEuro
    maxRedeemablePoints
    enableLoyaltyDiscount
    loyaltyDiscount
  }
`);

const getLoyaltySettings = graphql(
  `
    query LoyaltySettings {
      getLoyaltySettings {
        ...LoyaltySettingsItem
      }
    }
  `,
  [loyaltySettingsFragment],
);

const updateLoyaltySettingsDocument = graphql(
  `
    mutation UpdateLoyaltySettings($input: LoyaltySettingsInput!) {
      updateLoyaltySettings(input: $input) {
        ...LoyaltySettingsItem
      }
    }
  `,
  [loyaltySettingsFragment],
);

export { getLoyaltySettings, updateLoyaltySettingsDocument };
