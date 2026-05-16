import { gql } from 'graphql-tag';

const shopApiExtensions = gql`
  type ProductVariantPrice {
    currencyCode: CurrencyCode!
    price: Money!
  }

  extend type ProductVariant {
    prices: [ProductVariantPrice!]!
  }
`;

export { shopApiExtensions };
