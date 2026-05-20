import '@vendure/core';
import { Asset } from '@vendure/core';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
  interface CustomGlobalSettingsFields {
    percentageFee: number;
    fixedFee: number;
    easypayAccountUid: string;
  }
}
