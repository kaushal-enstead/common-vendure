import { Args, Query, Resolver } from '@nestjs/graphql';
import {
  Ctx,
  ID,
  ListQueryOptions,
  PaginatedList,
  Product,
  ProductVariant,
  RelationPaths,
  Relations,
  RequestContext,
} from '@vendure/core';
import { CustomFacetService } from '../../custom-facets-plugin/services/custom-facet.service';
import { CustomProductService } from '../services/custom-product.service';
@Resolver()
export class CustomProductShopResolver {
  constructor(
    private customProductService: CustomProductService,
    private customFacetService: CustomFacetService,
  ) {}

  @Query()
  // @Allow(Permission.Authenticated)
  async searchProducts(
    @Ctx() ctx: RequestContext,
    @Args()
    args: {
      options: ListQueryOptions<Product & { sellerId: ID; facetValueIds: ID; campaignId: ID }>;
    },
    @Relations(Product) relations: RelationPaths<Product>,
  ): Promise<PaginatedList<Product>> {
    const filter = args.options?.filter;
    const facetValueIds = filter?.facetValueIds?.in ?? [];
    const productIds = new Set<string>();

    if (facetValueIds?.length) {
      const productsWithFacets = await this.customFacetService.findFacetByType(ctx, 'PRODUCT', facetValueIds);
      if (!productsWithFacets.length) {
        return { items: [], totalItems: 0 };
      }

      productsWithFacets.forEach(product => productIds.add(product.id));
    }

    if (filter?.sellerId?.eq) {
      const sellerProducts = await this.customProductService.getSellerProducts(ctx, filter.sellerId.eq);
      sellerProducts.forEach(product => productIds.add(product.id as string));

      if (!sellerProducts.length) {
        return {
          items: [],
          totalItems: 0,
        };
      }
    }

    // if (filter?.campaignId?.eq) {
    //     const campaignProducts = await this.customProductService.getCampaignProducts(
    //         ctx,
    //         filter.campaignId.eq,
    //     );

    //     campaignProducts.forEach(c => productIds.add(c.productId as string));
    // }

    if (productIds.size > 0) {
      args.options.filter = {
        ...args.options.filter,
        id: { in: Array.from(productIds) },
      };
    }

    // Safely remove facetValueIds and sellerId and campaignId
    if (args.options?.filter && 'facetValueIds' in args.options.filter) {
      delete args.options.filter.facetValueIds;
    }
    if (args.options?.filter && 'sellerId' in args.options.filter) {
      delete args.options.filter.sellerId;
    }
    if (args.options?.filter && 'campaignId' in args.options.filter) {
      delete args.options.filter.campaignId;
    }
    return this.customProductService.findAll(ctx, args.options, relations);
  }

  @Query()
  // @Allow(Permission.Authenticated)
  async searchVariants(
    @Ctx() ctx: RequestContext,
    @Args()
    args: {
      options: ListQueryOptions<
        ProductVariant & { sellerId: ID; facetValueIds: ID; campaignId: ID; featuredProduct: boolean }
      >;
    },
    @Relations(ProductVariant) relations: RelationPaths<ProductVariant>,
  ): Promise<PaginatedList<ProductVariant>> {
    const filter = args.options?.filter;
    const facetValueIds = filter?.facetValueIds?.in ?? [];
    const productIds = new Set<string>();

    if (facetValueIds?.length) {
      const productsWithFacets = await this.customFacetService.findFacetByType(ctx, 'PRODUCT', facetValueIds);
      if (!productsWithFacets.length) {
        return { items: [], totalItems: 0 };
      }

      productsWithFacets.forEach(product => productIds.add(product.id));
    }

    if (filter?.sellerId?.eq) {
      const sellerProducts = await this.customProductService.getSellerProducts(ctx, filter.sellerId.eq);
      sellerProducts.forEach(product => productIds.add(product.id as string));
    }

    if (filter?.featuredProduct?.eq) {
      const featuredProducts = await this.customProductService.getFeaturedProducts(
        ctx,
        filter.featuredProduct.eq,
      );
      featuredProducts.forEach(product => productIds.add(product.id as string));
    }

    // if (filter?.campaignId?.eq) {
    //     const campaignProducts = await this.customProductService.getCampaignProducts(
    //         ctx,
    //         filter.campaignId.eq,
    //     );

    //     campaignProducts.forEach(c => productIds.add(c.productId as string));
    // }

    // Safely remove facetValueIds and sellerId and campaignId
    if (args.options?.filter && 'facetValueIds' in args.options.filter) {
      delete args.options.filter.facetValueIds;
    }
    if (args.options?.filter && 'sellerId' in args.options.filter) {
      delete args.options.filter.sellerId;
    }
    if (args.options?.filter && 'featuredProduct' in args.options.filter) {
      delete args.options.filter.featuredProduct;
    }
    // if (args.options?.filter && 'campaignId' in args.options.filter) {
    //     delete args.options.filter.campaignId;
    // }
    return this.customProductService.findAllVariants(ctx, productIds, args.options, relations);
  }
}
