import '@vendure/core';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
  interface QuantityPriceTier {
    price: number;
    quantityStart: number;
    quantityEnd: number;
  }
  interface CustomProductVariantFields {
    minQuantity?: number | null;
  }
  interface CustomProductVariantPriceFields {
    quantityPriceTiers?: QuantityPriceTier[] | null;
  }
}
