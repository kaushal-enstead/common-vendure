import '@vendure/core';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
  interface CustomSellerFields {
    collectionId?: string;
  }
}
