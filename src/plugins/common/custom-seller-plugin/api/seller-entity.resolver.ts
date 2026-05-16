import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Collection, Ctx, RequestContext, Seller, TransactionalConnection } from '@vendure/core';
import { WishlistItemType } from '../../wishlist-plugin/entities/wishlist.entity';
import { WishlistService } from '../../wishlist-plugin/services/wishlist.service';
import { CustomSellerService } from '../services/custom-seller.service';
import { ReviewService } from '../../review-plugin/services/review.service';
import { ReviewType } from '../../review-plugin/entities/review.entity';
@Resolver('Seller')
export class SellerEntityResolver {
    constructor(
        private connection: TransactionalConnection,
        private wishlistService: WishlistService,
        private customSellerService: CustomSellerService,
        private reviewService: ReviewService,
    ) {}

    @ResolveField()
    async serviceCount(@Ctx() ctx: RequestContext, @Parent() seller: Seller): Promise<number> {
        if (seller?.serviceCount !== undefined) {
            return seller.serviceCount;
        }

        return this.customSellerService.getServiceCount(ctx, seller.id);
    }

    @ResolveField()
    async averageRating(@Ctx() ctx: RequestContext, @Parent() seller: Seller): Promise<number | null> {
        if (seller?.averageRating !== undefined) {
            return seller.averageRating;
        }

        const ratings = await this.reviewService.getAverageEntityRating(ctx, [seller.id], ReviewType.SELLER);
        seller.reviewCount = ratings[0]?.reviewCount || null;
        seller.averageRating = ratings[0]?.rating || null;
        return ratings[0]?.rating || null;
    }

    @ResolveField()
    async reviewCount(@Ctx() ctx: RequestContext, @Parent() seller: Seller): Promise<number | null> {
        if (seller?.reviewCount !== undefined) {
            return seller.reviewCount;
        }

        const ratings = await this.reviewService.getAverageEntityRating(ctx, [seller.id], ReviewType.SELLER);
        seller.reviewCount = ratings[0]?.reviewCount || null;
        seller.averageRating = ratings[0]?.rating || null;
        return ratings[0]?.reviewCount || null;
    }

    @ResolveField()
    async productCount(@Ctx() ctx: RequestContext, @Parent() seller: Seller): Promise<number> {
        if (seller?.productCount !== undefined) {
            return seller.productCount;
        }

        return this.customSellerService.getProductCount(ctx, seller.id);
    }

    @ResolveField()
    async variantCount(@Ctx() ctx: RequestContext, @Parent() seller: Seller): Promise<number> {
        if (seller?.variantCount !== undefined) {
            return seller.variantCount;
        }

        return this.customSellerService.getVariantCount(ctx, seller.id);
    }

    @ResolveField()
    async isFavorite(@Ctx() ctx: RequestContext, @Parent() seller: Seller) {
        if (seller?.isFavorite !== undefined) {
            return seller.isFavorite;
        }

        return await this.wishlistService.isFavorite(ctx, WishlistItemType.SELLER, seller.id);
    }

    @ResolveField()
    async collection(@Ctx() ctx: RequestContext, @Parent() seller: Seller) {
        const collectionId = seller.customFields?.collectionId;
        if (!collectionId) {
            return null;
        }
        const collection = await this.connection
            .getRepository(ctx, Collection)
            .findOne({ where: { id: collectionId } });
        return collection;
    }

    @ResolveField()
    shopDescription(@Ctx() ctx: RequestContext, @Parent() seller: Seller): string | null {
        const lang = ctx.languageCode;
        return seller.customFields?.shopDescription?.[lang] ?? null;
    }

    @ResolveField()
    privacyPolicy(@Ctx() ctx: RequestContext, @Parent() seller: Seller): string | null {
        const lang = ctx.languageCode;
        return seller.customFields?.privacyPolicy?.[lang] ?? null;
    }

    @ResolveField()
    shippingPolicy(@Ctx() ctx: RequestContext, @Parent() seller: Seller): string | null {
        const lang = ctx.languageCode;
        return seller.customFields?.shippingPolicy?.[lang] ?? null;
    }

    @ResolveField()
    returnPolicy(@Ctx() ctx: RequestContext, @Parent() seller: Seller): string | null {
        const lang = ctx.languageCode;
        return seller.customFields?.returnPolicy?.[lang] ?? null;
    }
}
