import '@vendure/core';

declare module '@vendure/core' {
  interface CustomOrderLineFields {
    preOrderId?: string;
  }

  interface CustomProductFields {
    isPreOrder?: boolean;
  }
}
