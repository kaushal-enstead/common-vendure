import { Query, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, RequestContext } from '@vendure/core';
import { LoyaltyService } from '../services/loyalty.service';
import { LoyaltyPointSettings } from '../gql/generated';
import { Permission } from '@vendure/core';

@Resolver()
export class LoyaltyPointsShopResolver {
  constructor(private loyaltyService: LoyaltyService) {}

  @Query()
  @Allow(Permission.Authenticated)
  getLoyaltyPointSettings(@Ctx() ctx: RequestContext): Promise<LoyaltyPointSettings> {
    return this.loyaltyService.getLoyaltyPointSettings(ctx);
  }
}
