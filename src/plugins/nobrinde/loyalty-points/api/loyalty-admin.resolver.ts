import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, RelationPaths, RequestContext } from '@vendure/core';
import { LoyaltyService } from '../services/loyalty.service';
import { LoyaltySettingsInput, Tree } from '../gql/generated';
import { LoyaltySettings } from '../entities/loyalty-settings';
import { CustomerGroupsService } from '../services/customer-group.service';
import { AllocateLoyaltyPointsInput } from '../gql/generated';
import { LoyaltyPointsPermissions } from '../constants';

@Resolver()
export class LoyaltyPointsAdminResolver {
  constructor(
    private loyaltyService: LoyaltyService,
    private customerService: CustomerGroupsService,
  ) {}

  @Query()
  @Allow(LoyaltyPointsPermissions.Read)
  getLoyaltySettings(
    @Ctx() ctx: RequestContext,
    @Args('relations') relations?: RelationPaths<LoyaltySettings>,
  ): Promise<LoyaltySettings | null> {
    return this.loyaltyService.findOne(ctx, relations);
  }

  @Mutation()
  @Allow(LoyaltyPointsPermissions.Update)
  updateLoyaltySettings(
    @Ctx() ctx: RequestContext,
    @Args('input') input: LoyaltySettingsInput,
  ): Promise<LoyaltySettings> {
    return this.loyaltyService.update(ctx, input);
  }

  @Query()
  @Allow(LoyaltyPointsPermissions.Read)
  getCustomerGroups(
    @Ctx() ctx: RequestContext,
    @Args('search') search?: string,
    @Args('limit') limit?: number,
  ): Promise<Tree[]> {
    return this.customerService.getCustomerGroups(ctx);
  }

  @Mutation()
  @Allow(LoyaltyPointsPermissions.Update)
  allocateLoyaltyPoints(
    @Ctx() ctx: RequestContext,
    @Args('input') input: AllocateLoyaltyPointsInput,
  ): Promise<boolean> {
    return this.customerService.allocateLoyaltyPoints(ctx, input);
  }
}
