import { Args, Query, Resolver } from '@nestjs/graphql';
import { Permission, QueryPromotionArgs, QueryPromotionsArgs } from '@vendure/common/lib/generated-types';
import { PaginatedList } from '@vendure/common/lib/shared-types';
import {
    Allow,
    Ctx,
    Promotion,
    PromotionService,
    RelationPaths,
    Relations,
    RequestContext,
} from '@vendure/core';

@Resolver('Promotion')
export class PromotionResolver {
    constructor(private promotionService: PromotionService) {}

    @Query()
    @Allow(Permission.Public)
    promotions(
        @Ctx() ctx: RequestContext,
        @Args() args: QueryPromotionsArgs,
        @Relations(Promotion) relations: RelationPaths<Promotion>,
    ): Promise<PaginatedList<Promotion>> {
        return this.promotionService.findAll(ctx, args.options || undefined, relations);
    }

    @Query()
    @Allow(Permission.Public)
    promotion(
        @Ctx() ctx: RequestContext,
        @Args() args: QueryPromotionArgs,
        @Relations(Promotion) relations: RelationPaths<Promotion>,
    ): Promise<Promotion | undefined> {
        return this.promotionService.findOne(ctx, args.id, relations);
    }
}
