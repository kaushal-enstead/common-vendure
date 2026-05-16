import '@vendure/core';

declare module '@vendure/core' {
  interface Seller extends SellerType {
    isFavorite: boolean;
    serviceCount: number;
    productCount: number;
    collection: Collection;
    averageRating: number | null;
    reviewCount: number | null;
    variantCount: number;
  }
}
declare module '@vendure/core/dist/entity/custom-entity-fields' {
  interface CustomSellerFields {
    phone?: string;
    logo?: Asset;
    banner?: Asset[];
    vatNumber?: string;
    discount?: string;
    collectionId?: string;
    facetValue?: string[];
    company: {
      companyName?: string;
      companyBrand?: string;
      businessType?: string;
    };
    address?: {
      postalCode?: string;
      city?: string;
      country?: string;
      street?: string;
      streetLine2?: string;
      latitude?: number;
      longitude?: number;
    };
    contact?: {
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
    };
    acceptTerms?: boolean;
    connectedAccountId: string;
    status: string;
    isFeatured: boolean;
    enableLoyaltyDiscount?: boolean;
    loyaltyDiscount?: number;
    rejectReason?: string;
    socialDomains?: {
      facebookLink?: string;
      instagramLink?: string;
      twitterLink?: string;
      linkedinLink?: string;
      websiteLink?: string;
    };
    shopDescription?: Record<LanguageCode, string>;
    privacyPolicy?: Record<LanguageCode, string>;
    shippingPolicy?: Record<LanguageCode, string>;
    returnPolicy?: Record<LanguageCode, string>;
    daysOpen: Array<{
      day: string;
      openingHour: string;
      closingHour: string;
    }>;
    dpdAccountId?: string;
    dpdUsername?: string;
    dpdPassword?: string;
  }
}
