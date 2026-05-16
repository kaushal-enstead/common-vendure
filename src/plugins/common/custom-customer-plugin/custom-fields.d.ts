import '@vendure/core';
import { LoyaltyWalletHistory } from '../loyalty-points-plugin/entities/loyalty-wallet-history.entity';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
  interface CustomCustomerFields {
    points: number;
    freezePoints: number;
    history: LoyaltyWalletHistory[];
    vatNumber?: string;
    gender?: string;
    dateOfBirth?: Date;
    acceptTermsAndConditions?: boolean;
    marketingOptIn?: boolean;
  }

  interface CustomAddressFields {
    latitude?: number;
    longitude?: number;
  }
}
