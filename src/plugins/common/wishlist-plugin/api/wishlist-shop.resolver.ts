import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeletionResponse } from '../gql/generated';
import {
    Allow,
    Ctx,
    ListQueryOptions,
    PaginatedList,
    Permission,
    RelationPaths,
    Relations,
    RequestContext,
} from '@vendure/core';
import { Wishlist, WishlistItemType } from '../entities/wishlist.entity';
import { WishlistService } from '../services/wishlist.service';

@Resolver()
export class WishlistShopResolver {
    constructor(private wishlistService: WishlistService) {}

    @Query()
    @Allow(Permission.Authenticated)
    async wishlist(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: ListQueryOptions<Wishlist> },
        @Relations(Wishlist) relations: RelationPaths<Wishlist>,
    ): Promise<PaginatedList<Wishlist>> {
        return this.wishlistService.findAll(ctx, args.options || undefined, relations);
    }

    @Mutation()
    @Allow(Permission.Authenticated)
    async addToWishlist(
        @Ctx() ctx: RequestContext,
        @Args() args: { type: WishlistItemType; itemId: string },
    ): Promise<Wishlist> {
        return this.wishlistService.addToWishlist(ctx, args.type, args.itemId);
    }

    @Mutation()
    @Allow(Permission.Authenticated)
    async removeFromWishlist(
        @Ctx() ctx: RequestContext,
        @Args() args: { type: WishlistItemType; itemId: string },
    ): Promise<DeletionResponse> {
        return this.wishlistService.delete(ctx, args.type, args.itemId);
    }
}
