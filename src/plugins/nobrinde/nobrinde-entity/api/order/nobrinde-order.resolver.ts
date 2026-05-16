import { Args, Query, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, RelationPaths, Relations, RequestContext } from '@vendure/core';
import { NobrindeOrder } from '../../entities/nobrinde-orders';
import { NobrindeOrderPermissions } from '../../constants';
import { NobrindeOrderService } from '../../services/nobrinde-order.service';
import { QueryNobrindeOrdersArgs } from '../../gql/generated';
import { PaginatedList } from '@vendure/core';

@Resolver()
export class NobrindeOrderResolver {
  constructor(private nobrindeOrderService: NobrindeOrderService) {}

  @Query()
  @Allow(NobrindeOrderPermissions.Read)
  async nobrindeOrders(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryNobrindeOrdersArgs,
    @Relations({ entity: NobrindeOrder }) relations: RelationPaths<NobrindeOrder>,
  ): Promise<PaginatedList<NobrindeOrder>> {
    return this.nobrindeOrderService.findAll(ctx, args.options as never, relations);
  }

  @Query()
  @Allow(NobrindeOrderPermissions.Read)
  async nobrindeOrder(@Ctx() ctx: RequestContext, @Args('id') id: string): Promise<NobrindeOrder | null> {
    return this.nobrindeOrderService.findOne(ctx, id);
  }
}
