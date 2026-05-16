import '@vendure/core';
import { Asset, LanguageCode, Product as ProductType, Seller } from '@vendure/core';

declare module '@vendure/core' {
  interface Product {
    isFavorite: boolean;
    seller: Seller;
    // campaignProduct: CampaignProducts | null;
    averageRating: number | null;
    reviewCount: number | null;
  }
}

declare module '@vendure/core/dist/entity/custom-entity-fields' {
  interface CustomProductFields {
    // General tab
    newProduct?: boolean;
    featuredProduct?: boolean;
    isPreOrder?: boolean;

    // Marketing tab
    cross_sell_products?: ProductType[];
    up_sell_products?: ProductType[];
    seo_tag?: Record<LanguageCode, string>;
    seo_description?: Record<LanguageCode, string>;

    // Logistics tab
    weight?: number;
    height?: number;
    width?: number;
    length?: number;

    // Per Unit tab
    unit_type?: 'g' | 'cm' | 'ml';
    product_per_unit?: boolean;

    // Bundle tab
    // variantIds?: string[];
    // bundleId?: string;
    // bundlePrice?: number;
    // isBundle?: boolean;
  }

  interface CustomProductVariantFields {
    weight?: number;
    height?: number;
    width?: number;
    length?: number;
  }
}
