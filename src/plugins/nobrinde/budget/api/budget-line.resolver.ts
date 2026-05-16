import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  Asset,
  Ctx,
  OrderLine,
  ProductVariant,
  RelationPaths,
  Relations,
  RequestContext,
} from '@vendure/core';
import { AssetService, ProductVariantService } from '@vendure/core';
import { Budget } from '../entity/budget';
import { BudgetService } from '../services/budget.service';
import { BudgetLine } from '../entity/budget-line';

@Resolver('BudgetLine')
export class BudgetLineEntityResolver {
  constructor(
    private productVariantService: ProductVariantService,
    private assetService: AssetService,
    private budgetService: BudgetService,
  ) {}

  @ResolveField()
  async productVariant(@Ctx() ctx: RequestContext, @Parent() orderLine: OrderLine): Promise<ProductVariant> {
    if (orderLine.productVariant) {
      return orderLine.productVariant;
    }
    return this.productVariantService.getVariantByOrderLineId(ctx, orderLine.id);
  }

  @ResolveField()
  async featuredAsset(
    @Ctx() ctx: RequestContext,
    @Parent() orderLine: OrderLine,
  ): Promise<Asset | undefined> {
    // In some scenarios (e.g. modifying an order to add a new item), orderLine.featuredAsset is an object
    // with only an `id`. Since the resolver expects the featuredAsset to be a full Asset object, we need to
    // fetch the full Asset object if it's not already populated.
    if (!orderLine.featuredAsset?.preview) {
      return this.assetService.getFeaturedAsset(ctx, orderLine);
    } else {
      return orderLine.featuredAsset;
    }
  }

  @ResolveField()
  async budget(
    @Ctx() ctx: RequestContext,
    @Parent() budgetLine: BudgetLine,
    @Relations(Budget) relations: RelationPaths<Budget>,
  ): Promise<Budget | undefined> {
    return this.budgetService.findOneByOrderLineId(ctx, budgetLine.id, relations);
  }
}
