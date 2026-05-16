import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext } from '@vendure/core';
import { NobrindeOrder, NobrindeOrderLine } from '../../entities/nobrinde-orders';
import { NobrindeOrderService } from '../../services/nobrinde-order.service';

@Resolver('NobrindeOrder')
export class NobrindeOrderEntityResolver {
  constructor(private nobrindeOrderService: NobrindeOrderService) {}

  @ResolveField()
  async lines(@Ctx() ctx: RequestContext, @Parent() order: NobrindeOrder): Promise<NobrindeOrderLine[]> {
    if (order.lines) {
      return order.lines;
    }
    return this.nobrindeOrderService.getLinesForOrder(ctx, order);
  }
}
