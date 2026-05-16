import '@vendure/core';
import { LoyaltyWalletHistory } from './entities/loyalty-wallet-history.entity';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
  // interface CustomSellerFields {
  //   enableLoyaltyDiscount?: boolean;
  //   loyaltyDiscount?: number;
  //   pointsPerEuro?: number;
  //   maxRedeemablePoints?: number;
  // }

  interface CustomCustomerFields {
    points: number;
    freezePoints: number;
    history: LoyaltyWalletHistory[];
  }
}
