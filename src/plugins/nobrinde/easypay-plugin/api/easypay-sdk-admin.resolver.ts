import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, RequestContext } from '@vendure/core';
import { Permission } from '@vendure/common/lib/generated-types';
import { EasypaySdkService } from '../services/easypay-sdk.service';

@Resolver()
export class EasypaySdkAdminResolver {
  constructor(private easypaySdkService: EasypaySdkService) {}

  @Mutation()
  @Allow(Permission.SuperAdmin)
  async cancelEasypayCheckout(
    @Ctx() ctx: RequestContext,
    @Args('checkoutId') checkoutId: string,
  ): Promise<boolean> {
    return this.easypaySdkService.cancelCheckout(ctx, checkoutId);
  }

  @Mutation()
  @Allow(Permission.SuperAdmin)
  async createEasypayRefund(
    @Ctx() ctx: RequestContext,
    @Args('paymentId') paymentId: string,
  ): Promise<boolean> {
    return this.easypaySdkService.createRefund(ctx, paymentId);
  }
}
