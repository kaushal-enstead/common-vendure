import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Ctx, ProductVariant, RequestContext, TransactionalConnection } from '@vendure/core';
import { NobrindeOrderLine } from '../../entities/nobrinde-orders';

@Resolver('NobrindeOrderLine')
export class NobrindeOrderLineEntityResolver {
  constructor(private connection: TransactionalConnection) {}

  @ResolveField()
  async productVariant(
    @Ctx() ctx: RequestContext,
    @Parent() orderLine: NobrindeOrderLine,
  ): Promise<ProductVariant | null> {
    const sku = orderLine.referencia_externa?.trim();
    if (!sku) {
      return null;
    }

    return this.connection.getRepository(ctx, ProductVariant).findOne({
      where: { sku },
    });
  }
}
