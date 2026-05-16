import { LanguageCode, PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { MinQuantityOrderInterceptor } from './min-quantity.order-interceptor';
import { QuantityPriceCalculationStrategy } from './quantity-price-calculation.strategy';
import { shopApiExtensions } from './api/api-extensions';
import { ProductVariantShopEntityResolver } from './api/product-variant.resolver';

/**
 * Adds quantity-based tier pricing for product variants.
 *
 * - Add a custom field `quantityPriceTiers` on ProductVariant (JSON array of
 *   { price, quantityStart, quantityEnd }).
 * - When adding to order/budget, if the line quantity falls within a tier's range,
 *   that tier's price is used as the unit price; otherwise the variant's default price is used.
 *
 * Tiers are inclusive: quantityStart <= quantity <= quantityEnd.
 */
@VendurePlugin({
  imports: [PluginCommonModule],
  configuration: config => {
    // config.customFields.ProductVariant.push({
    //   name: 'quantityPriceTiers',
    //   type: 'struct',
    //   fields: [
    //     { name: 'price', type: 'float' },
    //     { name: 'quantityStart', type: 'int' },
    //     { name: 'quantityEnd', type: 'int' },
    //   ],
    //   nullable: true,
    //   list: true,
    //   label: [
    //     { languageCode: LanguageCode.en, value: 'Quantity price tiers' },
    //     { languageCode: LanguageCode.pt, value: 'Escalões de preço por quantidade' },
    //   ],
    //   description: [
    //     {
    //       languageCode: LanguageCode.en,
    //       value: 'When order quantity falls in a range, that price (per unit) is used.',
    //     },
    //     {
    //       languageCode: LanguageCode.pt,
    //       value: 'Quando a quantidade encomendada está no intervalo, esse preço (por unidade) é usado.',
    //     },
    //   ],
    //   ui: { tab: 'Pricing', component: 'quantity-price-tiers-editor', colSpan: 12, fieldType: 'textarea' },
    // });
    config.customFields.ProductVariant.push({
      name: 'minQuantity',
      type: 'int',
      nullable: true,
      label: [
        { languageCode: LanguageCode.en, value: 'Min Quantity' },
        { languageCode: LanguageCode.pt, value: 'Quantidade Mínima' },
      ],
    });
    config.customFields.ProductVariantPrice.push({
      name: 'quantityPriceTiers',
      type: 'struct',
      fields: [
        { name: 'price', type: 'float' },
        { name: 'quantityStart', type: 'int' },
        { name: 'quantityEnd', type: 'int' },
      ],
      nullable: true,
      list: true,
      public: true,
      label: [
        { languageCode: LanguageCode.en, value: 'Quantity price tiers' },
        { languageCode: LanguageCode.pt, value: 'Escalões de preço por quantidade' },
      ],
      description: [
        {
          languageCode: LanguageCode.en,
          value: 'When order quantity falls in a range, that price (per unit) is used.',
        },
        {
          languageCode: LanguageCode.pt,
          value: 'Quando a quantidade encomendada está no intervalo, esse preço (por unidade) é usado.',
        },
      ],
      ui: { tab: 'Pricing', component: 'quantity-price-tiers-editor' },
    });
    config.orderOptions = config.orderOptions ?? {};
    config.orderOptions.orderItemPriceCalculationStrategy = new QuantityPriceCalculationStrategy();
    config.orderOptions.orderInterceptors.push(new MinQuantityOrderInterceptor());
    return config;
  },
  compatibility: '^3.0.0',
  dashboard: './dashboard/index.tsx',
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [ProductVariantShopEntityResolver],
  },
})
export class QuantityPricingPlugin {
  static init(): Type<QuantityPricingPlugin> {
    return QuantityPricingPlugin;
  }
}
