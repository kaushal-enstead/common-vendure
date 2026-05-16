import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ProductVariant, ProductVariantPrice } from '@vendure/common/lib/generated-types';
import { ProductVariantService, Ctx, RequestContext } from '@vendure/core';

@Resolver('ProductVariant')
export class ProductVariantShopEntityResolver {
  constructor(private productVariantService: ProductVariantService) {}

  @ResolveField()
  async prices(
    @Ctx() ctx: RequestContext,
    @Parent() productVariant: ProductVariant,
  ): Promise<ProductVariantPrice[]> {
    // if (productVariant.productVariantPrices) {
    //   return productVariant.productVariantPrices.filter(pvp => idsAreEqual(pvp.channelId, ctx.channelId));
    // }
    return this.productVariantService.getProductVariantPrices(ctx, productVariant.id);
  }
}
