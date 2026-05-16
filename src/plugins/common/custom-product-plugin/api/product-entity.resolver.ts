import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  Ctx,
  Product,
  ProductService,
  ProductVariantService,
  RequestContext,
  Seller,
  TransactionalConnection,
} from '@vendure/core';
// import { CampaignProducts } from '../../campaign-plugin/entities/campaign-products.entity';
import { WishlistItemType } from '../../wishlist-plugin/entities/wishlist.entity';
import { WishlistService } from '../../wishlist-plugin/services/wishlist.service';
import { ReviewType } from '../../review-plugin/entities/review.entity';
import { ReviewService } from '../../review-plugin/services/review.service';
@Resolver('Product')
export class ProductEntityResolver {
  constructor(
    private connection: TransactionalConnection,
    private wishlistService: WishlistService,
    private productService: ProductService,
    private productVariantService: ProductVariantService,
    private reviewService: ReviewService,
  ) {}

  @ResolveField()
  async isFavorite(@Ctx() ctx: RequestContext, @Parent() product: Product) {
    if (product?.isFavorite !== undefined) {
      return product.isFavorite;
    }

    return await this.wishlistService.isFavorite(ctx, WishlistItemType.PRODUCT, product.id);
  }

  @ResolveField()
  async averageRating(@Ctx() ctx: RequestContext, @Parent() product: Product): Promise<number | null> {
    if (product?.averageRating !== undefined) {
      return product.averageRating;
    }

    const ratings = await this.reviewService.getAverageEntityRating(ctx, [product.id], ReviewType.PRODUCT);
    product.reviewCount = ratings[0]?.reviewCount || null;
    product.averageRating = ratings[0]?.rating || null;
    return ratings[0]?.rating || null;
  }

  @ResolveField()
  async reviewCount(@Ctx() ctx: RequestContext, @Parent() product: Product): Promise<number | null> {
    if (product?.reviewCount !== undefined) {
      return product.reviewCount;
    }

    const ratings = await this.reviewService.getAverageEntityRating(ctx, [product.id], ReviewType.PRODUCT);
    product.reviewCount = ratings[0]?.reviewCount || null;
    product.averageRating = ratings[0]?.rating || null;
    return ratings[0]?.reviewCount || null;
  }

  @ResolveField()
  async seller(@Ctx() ctx: RequestContext, @Parent() product: Product): Promise<Seller | undefined> {
    if (product?.seller !== undefined) {
      return product.seller;
    }
    const productData = await this.productService.findOne(ctx, product.id, ['channels', 'channels.seller']);
    const channel = productData?.channels?.find(channel => channel.code !== '__default_channel__');

    if (!channel?.seller) {
      throw new Error(`No seller found for product ${product.id}`);
    }

    return channel.seller;
  }

  // @ResolveField()
  // async campaignProduct(
  //     @Ctx() ctx: RequestContext,
  //     @Parent() product: Product,
  // ): Promise<CampaignProducts | null> {
  //     if (product?.campaignProduct !== undefined) {
  //         return product.campaignProduct ?? null;
  //     }
  //     const campaignProduct = await this.connection.getRepository(ctx, CampaignProducts).findOne({
  //         where: { productId: product.id },
  //         relations: ['campaign'],
  //     });

  //     if (!campaignProduct) {
  //         return null;
  //     }

  //     return campaignProduct;
  // }

  // @ResolveField()
  // async variants(
  //     @Ctx() ctx: RequestContext,
  //     @Parent() product: Product,
  //     @Relations({ entity: ProductVariant, omit: ['assets'] }) relations: RelationPaths<ProductVariant>,
  // ): Promise<ProductVariant[]> {
  //     const { variantIds = [], isBundle } = product.customFields;
  //     if (!isBundle) {
  //         if (product.variants) {
  //             return product.variants;
  //         }

  //         const { items: variants } = await this.productVariantService.getVariantsByProductId(
  //             ctx,
  //             product.id,
  //             {},
  //             relations,
  //         );
  //         return variants;
  //     }

  //     if (!variantIds.length) {
  //         return [];
  //     }

  //     const productVariants = await this.productVariantService.findByIds(ctx, variantIds);
  //     // TODO: Add priceWithTax to the product variants from bundle if needed
  //     return productVariants;
  // }

  // @ResolveField()
  // async variantList(
  //     @Ctx() ctx: RequestContext,
  //     @Parent() product: Product,
  //     @Args() args: { options: ListQueryOptions<ProductVariant> },
  //     @Relations({ entity: ProductVariant, omit: ['assets'] }) relations: RelationPaths<ProductVariant>,
  // ): Promise<PaginatedList<ProductVariant>> {
  //     const { variantIds = [], isBundle } = product.customFields;
  //     if (isBundle) {
  //         const productVariants = await this.productVariantService.findAll(ctx, {
  //             filter: { ...args.options?.filter, id: { in: variantIds } },
  //             ...args.options,
  //         });
  //         return productVariants;
  //     }

  //     return this.productVariantService.getVariantsByProductId(ctx, product.id, args.options, relations);
  // }
}
