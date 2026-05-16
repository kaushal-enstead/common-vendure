import '@vendure/core';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
  interface CustomCustomerFields {
    credits: number;
    credits_used: number;
  }
}
