import '@vendure/core';
import { Asset } from './gql/generated';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
  interface CustomProductFields {
    qrCodeAsset?: Asset;
  }

  interface CustomProductVariantFields {
    qrCodeAsset?: Asset;
  }
}
