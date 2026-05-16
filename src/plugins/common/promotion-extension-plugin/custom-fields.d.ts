import '@vendure/core';

declare module '@vendure/core' {
  interface CustomOrderLineFields {
    freeGiftPromotionId?: string;
    freeGiftDescription?: string;
  }
}
