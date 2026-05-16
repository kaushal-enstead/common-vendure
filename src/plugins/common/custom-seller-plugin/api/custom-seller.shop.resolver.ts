import { Args, Query, Resolver } from '@nestjs/graphql';
import {
    Ctx,
    ID,
    ListQueryOptions,
    PaginatedList,
    RelationPaths,
    Relations,
    RequestContext,
    Seller,
} from '@vendure/core';
import { CustomFacetService } from '../../custom-facets-plugin/services/custom-facet.service';
import { CustomSellerService } from '../services/custom-seller.service';
@Resolver()
export class CustomSellerShopResolver {
    constructor(
        private customSellerService: CustomSellerService,
        private customFacetService: CustomFacetService,
    ) {}

    @Query()
    // @Allow(Permission.Authenticated)
    async sellers(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: ListQueryOptions<Seller> },
        @Relations(Seller) relations: RelationPaths<Seller>,
    ): Promise<PaginatedList<Seller>> {
        const facetValueIds = (args.options.filter as any)?.facetValueIds?.in ?? [];
        if (facetValueIds.length > 0) {
            const sellersWithFacets = await this.customFacetService.findFacetByType(
                ctx,
                'SELLER',
                facetValueIds,
            );

            if (!sellersWithFacets.length) {
                return {
                    items: [],
                    totalItems: 0,
                };
            }

            args.options.filter = {
                ...args.options.filter,
                id: { in: sellersWithFacets.map(s => s.id) },
            };
        }

        // Safely remove facetValueIds
        if (args.options?.filter && 'facetValueIds' in args.options.filter) {
            delete args.options.filter.facetValueIds;
        }
        return this.customSellerService.findAll(ctx, args.options, relations);
    }

    @Query()
    // @Allow(Permission.Authenticated)
    async seller(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<Seller | null> {
        const seller = await this.customSellerService.findOne(ctx, args.id);
        return seller;
    }
}
