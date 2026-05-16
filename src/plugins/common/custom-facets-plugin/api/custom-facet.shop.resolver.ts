import { Args, Query, Resolver } from '@nestjs/graphql';
import { Ctx, Facet, FacetService, ID, RequestContext } from '@vendure/core';
import { CustomFacetService, FacetType } from '../services/custom-facet.service';

@Resolver()
export class CustomFacetShopResolver {
    constructor(
        private customFacetService: CustomFacetService,
        private facetService: FacetService,
    ) {}

    @Query()
    async facetsList(
        @Ctx() ctx: RequestContext,
        @Args() args: { type: FacetType; parentId: ID },
    ): Promise<Facet[]> {
        const facetData = await this.customFacetService.findFacetCountByType(ctx, args.type || 'seller');

        const { facetIds, facetValueIds } = await this.customFacetService.findAssociatedFacets(
            ctx,
            args.type || 'seller',
            args.parentId,
        );
        if (!facetIds.length || !facetValueIds.length) {
            return [];
        }

        const facets = await this.facetService.findAll(ctx, {
            sort: { name: 'ASC' },
            filter: {
                isPrivate: { eq: false },
                ...(args.parentId && { id: { in: facetIds } }),
            },
        });
        const facetValues = facets.items.map(facet => ({
            ...facet,
            values: facet.values
                .map(value => {
                    const found = facetData.find(s => s.facetValueId === value.id);
                    value.code = found?.count ? found.count.toString() : '0';
                    return value;
                })
                .filter(value => facetValueIds.includes(value.id.toString())),
        }));

        return facetValues.filter(facet => facet.values.length);
    }
}
