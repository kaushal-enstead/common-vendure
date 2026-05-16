import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  Allow,
  Ctx,
  ID,
  ListQueryOptions,
  PaginatedList,
  RelationPaths,
  Relations,
  RequestContext,
  Transaction,
} from '@vendure/core';
import { PreOrder } from '../entities/pre-order.entity';
import { CreatePreOrderInput, UpdatePreOrderInput } from '../gql/generated';
import { PreOrderService } from '../services/pre-order.service';
import { preOrderPermissions } from '../constants';

@Resolver()
export class PreOrderAdminResolver {
  constructor(private preOrderService: PreOrderService) {}

  @Query()
  @Allow(preOrderPermissions.Read)
  async preOrder(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
    @Relations(PreOrder) relations: RelationPaths<PreOrder>,
  ): Promise<PreOrder | null> {
    return this.preOrderService.findOne(ctx, args.id, relations);
  }

  @Query()
  @Allow(preOrderPermissions.Read)
  async preOrders(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<PreOrder> },
    @Relations(PreOrder) relations: RelationPaths<PreOrder>,
  ): Promise<PaginatedList<PreOrder>> {
    return this.preOrderService.findAll(ctx, args.options || undefined, relations);
  }

  @Mutation()
  @Transaction()
  @Allow(preOrderPermissions.Create)
  async createPreOrder(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: CreatePreOrderInput },
  ): Promise<PreOrder> {
    const sanitizedInput = {
      ...args.input,
      customerId: args.input.customerId ?? undefined,
    };
    return this.preOrderService.create(ctx, sanitizedInput);
  }

  @Mutation()
  @Transaction()
  @Allow(preOrderPermissions.Update)
  async updatePreOrder(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdatePreOrderInput },
  ): Promise<PreOrder> {
    return this.preOrderService.update(ctx, args.input);
  }

  @Mutation()
  @Transaction()
  @Allow(preOrderPermissions.Update)
  async acceptPreOrder(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<boolean> {
    return this.preOrderService.acceptPreOrder(ctx, args.id);
  }

  @Mutation()
  @Transaction()
  @Allow(preOrderPermissions.Update)
  async acceptMultiplePreOrders(
    @Ctx() ctx: RequestContext,
    @Args() args: { preOrderIds: ID[] },
  ): Promise<boolean> {
    await Promise.all(args.preOrderIds.map(id => this.preOrderService.acceptPreOrder(ctx, id)));
    return true;
    // return this.preOrderService.acceptMultiplePreOrdersAndCreateDraftOrder(ctx, args.preOrderIds);
  }

  @Mutation()
  @Transaction()
  @Allow(preOrderPermissions.Delete)
  async cancelPreOrder(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<boolean> {
    return this.preOrderService.cancelPreOrder(ctx, args.id);
  }
}
