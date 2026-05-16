import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ProductVariant, RequestContext, Ctx, TransactionalConnection } from '@vendure/core';
import { NobrindeBudgetLine } from '../../entities/nobrinde-budgets';

@Resolver('NobrindeBudgetLine')
export class NobrindeBudgetLineEntityResolver {
  constructor(private connection: TransactionalConnection) {}

  @ResolveField()
  async productVariant(
    @Ctx() ctx: RequestContext,
    @Parent() budgetLine: NobrindeBudgetLine,
  ): Promise<ProductVariant | null> {
    const sku = budgetLine.referencia_externa?.trim();
    if (!sku) {
      return null;
    }

    return this.connection.getRepository(ctx, ProductVariant).findOne({
      where: { sku },
    });
  }
}
