import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AssetService, Ctx, RequestContext } from '@vendure/core';
import { NobrindeBudget, NobrindeBudgetLine } from '../../entities/nobrinde-budgets';
import { NobrindeBudgetService } from '../../services/nobrinde-budget.service';

@Resolver('NobrindeBudget')
export class NobrindeBudgetEntityResolver {
  constructor(
    private nobrindeBudgetService: NobrindeBudgetService,
    private assetService: AssetService,
  ) {}

  @ResolveField()
  async lines(@Ctx() ctx: RequestContext, @Parent() budget: NobrindeBudget): Promise<NobrindeBudgetLine[]> {
    if (budget.lines) {
      return budget.lines;
    }
    return this.nobrindeBudgetService.getLinesForBudget(ctx, budget);
  }

  @ResolveField()
  async pdfAsset(@Ctx() ctx: RequestContext, @Parent() budget: NobrindeBudget) {
    if (!budget.pdfAssetId) return null;
    return this.assetService.findOne(ctx, budget.pdfAssetId);
  }
}
