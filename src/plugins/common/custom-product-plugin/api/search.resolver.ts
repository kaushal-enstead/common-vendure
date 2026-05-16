import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext } from '@vendure/core';
import { WishlistService } from '../../wishlist-plugin/services/wishlist.service';
import { WishlistItemType } from '../../wishlist-plugin/entities/wishlist.entity';
import { SearchResult } from '../gql/generated';

@Resolver('SearchResult')
export class SearchResolver {
    constructor(private readonly wishlistService: WishlistService) {}

    @ResolveField()
    async isFavorite(
        @Ctx() ctx: RequestContext,
        @Parent() searchResult: SearchResult & { isFavorite: boolean },
    ) {
        if (searchResult?.isFavorite !== undefined) {
            return searchResult.isFavorite;
        }

        return await this.wishlistService.isFavorite(ctx, WishlistItemType.PRODUCT, searchResult.productId);
    }
}
