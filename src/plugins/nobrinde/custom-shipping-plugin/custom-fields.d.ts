import '@vendure/core';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
  interface CustomOrderFields {
    customShippingQuoteStatus?: string | null;
    customShippingQuoteAmount?: number | null;
    customShippingQuoteUpdatedAt?: Date | null;
    customShippingDestination?: string | null;
  }

  interface CustomProductVariantFields {
    weight?: number | null;
  }

  interface CustomProductFields {
    weight?: number | null;
  }

  interface CustomZoneFields {
    shippingZonePriority?: number | null;
  }
}
