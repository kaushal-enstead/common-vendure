import '@vendure/core';
import { LoyaltyWalletHistory } from '../plugins/loyalty-points-plugin/entities/loyalty-wallet-history.entity';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
  interface CustomSellerFields {
    enableLoyaltyDiscount?: boolean;
    loyaltyDiscount?: number;
  }

  interface CustomGlobalSettingsFields {
    maxRedeemablePoints: number;
    pointsPerEuro: number;
  }

  interface CustomCustomerFields {
    points: number;
    freezePoints: number;
    history: LoyaltyWalletHistory[];
  }
}
