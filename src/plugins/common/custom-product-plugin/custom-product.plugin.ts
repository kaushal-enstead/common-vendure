import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { CustomFacetPluginModule } from '../custom-facets-plugin/custom-facets.plugin';
import { ReviewPluginModule } from '../review-plugin/review.plugin';
import { WishlistPluginModule } from '../wishlist-plugin/wishlist.plugin';
import { shopApiExtensions } from './api/api-extensions';
import { CustomProductShopResolver } from './api/custom-product.shop.resolver';
import { ProductEntityResolver } from './api/product-entity.resolver';
import { SearchResolver } from './api/search.resolver';
import { CustomProductService } from './services/custom-product.service';
import { PluginInitOptions } from './types';
import { customProductFields } from './custom-fields';
@VendurePlugin({
  imports: [PluginCommonModule, WishlistPluginModule, ReviewPluginModule, CustomFacetPluginModule],
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [CustomProductShopResolver, ProductEntityResolver, SearchResolver],
  },
  providers: [CustomProductService],
  configuration: config => {
    config.customFields.Product.push(...customProductFields);
    return config;
  },
  compatibility: '^3.0.0',
})
export class CustomProductPlugin {
  static options: PluginInitOptions;

  static init(options: PluginInitOptions): Type<CustomProductPlugin> {
    this.options = options;
    return CustomProductPlugin;
  }
  constructor() {}
}
