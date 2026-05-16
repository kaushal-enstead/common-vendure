import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { WishlistPluginModule } from '../wishlist-plugin/wishlist.plugin';
import { adminApiExtensions, shopApiExtensions } from './api/api-extensions';
import { CustomSellerAdminResolver } from './api/custom-seller.admin.resolver';
import { CustomSellerShopResolver } from './api/custom-seller.shop.resolver';
import { SellerEntityResolver } from './api/seller-entity.resolver';
import { CustomSellerService } from './services/custom-seller.service';
import { PluginInitOptions } from './types';
import { ReviewPluginModule } from '../review-plugin/review.plugin';
import { CustomFacetPluginModule } from '../custom-facets-plugin/custom-facets.plugin';
import { sellerCustomFields } from './util';
import { sellerRejectionHandler, sellerApprovalHandler } from './events/event-handler';

@VendurePlugin({
  imports: [PluginCommonModule, WishlistPluginModule, ReviewPluginModule, CustomFacetPluginModule],
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [CustomSellerShopResolver, SellerEntityResolver],
  },
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [CustomSellerAdminResolver],
  },
  providers: [CustomSellerService],
  configuration: config => {
    config.customFields.Seller.push(...sellerCustomFields);
    return config;
  },
  compatibility: '^3.0.0',
  dashboard: './dashboard/index.tsx',
})
export class CustomSellerPlugin {
  static options: PluginInitOptions;

  static init(options: PluginInitOptions): Type<CustomSellerPlugin> {
    this.options = options;
    return CustomSellerPlugin;
  }

  static emailHandlers = [sellerRejectionHandler, sellerApprovalHandler];
}
