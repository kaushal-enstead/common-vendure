import { Query, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, RequestContext, Permission } from '@vendure/core';
import { LoyaltyService } from '../services/loyalty.service';
import { LoyaltyPointsSettings } from '../gql/generated';

@Resolver()
export class LoyaltyPointsShopResolver {
    constructor(private loyaltyService: LoyaltyService) {}

    @Query()
    @Allow(Permission.Authenticated)
    getLoyaltyPointsSettings(@Ctx() ctx: RequestContext): Promise<LoyaltyPointsSettings> {
        return this.loyaltyService.getLoyaltySettings(ctx);
    }
}
