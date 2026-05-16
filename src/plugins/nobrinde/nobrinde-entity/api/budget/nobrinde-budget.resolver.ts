import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, ListQueryOptions, RelationPaths, Relations, RequestContext } from '@vendure/core';
import { NobrindeBudget } from '../../entities/nobrinde-budgets';
import { NobrindeBudgetPermissions } from '../../constants';
import { NobrindeBudgetService } from '../../services/nobrinde-budget.service';
import { QueryNobrindeBudgetsArgs } from '../../gql/generated';
import { PaginatedList } from '@vendure/core';

@Resolver()
export class NobrindeBudgetResolver {
  constructor(private nobrindeBudgetService: NobrindeBudgetService) {}

  @Query()
  @Allow(NobrindeBudgetPermissions.Read)
  async nobrindeBudgets(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryNobrindeBudgetsArgs,
    @Relations({ entity: NobrindeBudget }) relations: RelationPaths<NobrindeBudget>,
  ): Promise<PaginatedList<NobrindeBudget>> {
    return this.nobrindeBudgetService.findAll(
      ctx,
      (args.options || undefined) as ListQueryOptions<NobrindeBudget>,
      relations,
    );
  }

  @Query()
  @Allow(NobrindeBudgetPermissions.Read)
  async nobrindeBudget(@Ctx() ctx: RequestContext, @Args('id') id: string): Promise<NobrindeBudget | null> {
    return this.nobrindeBudgetService.findOne(ctx, id);
  }

  @Mutation()
  @Allow(NobrindeBudgetPermissions.Update)
  async generateNobrindeBudgetPdf(@Ctx() ctx: RequestContext, @Args('id') id: string) {
    return this.nobrindeBudgetService.generatePdf(ctx, id);
  }
}
