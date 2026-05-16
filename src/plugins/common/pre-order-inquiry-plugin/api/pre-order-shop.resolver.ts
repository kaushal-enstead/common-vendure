import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext, Transaction, Allow, Permission, Order } from '@vendure/core';
import { PreOrderService } from '../services/pre-order.service';
import { ID } from '@vendure/common/lib/shared-types';
import { PreOrder } from '../entities/pre-order.entity';
import { CreatePreOrderInput } from '../gql/generated';
import { ListQueryOptions } from '@vendure/core';

@Resolver()
export class PreOrderShopResolver {
    constructor(private preOrderService: PreOrderService) {}

    @Mutation()
    @Transaction()
    @Allow(Permission.Authenticated)
    async cancelPreOrder(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<boolean> {
        return this.preOrderService.cancelPreOrder(ctx, args.id);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Authenticated)
    async convertToOrder(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<Order> {
        return this.preOrderService.convertToOrder(ctx, args.id);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Authenticated)
    async createPreOrder(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: CreatePreOrderInput },
    ): Promise<PreOrder> {
        return this.preOrderService.create(ctx, args.input);
    }

    @Query()
    @Allow(Permission.Authenticated)
    async myPreOrders(
        @Ctx() ctx: RequestContext,
        @Args() args: { options?: ListQueryOptions<PreOrder> },
    ): Promise<{ items: PreOrder[]; totalItems: number }> {
        return this.preOrderService.findMyPreOrders(ctx, args.options);
    }
}
