import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { BudgetService } from '../services/budget.service';
import {
  assertFound,
  Ctx,
  CustomerService,
  idsAreEqual,
  RequestContext,
  TranslatorService,
} from '@vendure/core';
import { Budget } from '../entity/budget';

@Resolver('Budget')
export class BudgetEntityResolver {
  constructor(
    private budgetService: BudgetService,
    private customerService: CustomerService,
    private translator: TranslatorService,
  ) {}

  @ResolveField()
  async channels(@Ctx() ctx: RequestContext, @Parent() budget: Budget) {
    const channels = budget.channels ?? (await this.budgetService.getBudgetChannels(ctx, budget));
    return channels.filter(channel =>
      ctx.session?.user?.channelPermissions.find(cp => idsAreEqual(cp.id, channel.id)),
    );
  }

  @ResolveField()
  async customer(@Ctx() ctx: RequestContext, @Parent() budget: Budget) {
    if (budget.customer) {
      return budget.customer;
    }
    if (budget.customerId) {
      return this.customerService.findOne(ctx, budget.customerId);
    }
  }

  @ResolveField()
  async lines(@Ctx() ctx: RequestContext, @Parent() budget: Budget) {
    if (budget.lines) {
      return budget.lines;
    }
    const { lines } = await assertFound(this.budgetService.findOne(ctx, budget.id));
    return lines;
  }

  @ResolveField()
  async promotions(@Ctx() ctx: RequestContext, @Parent() budget: Budget) {
    // If the order has been hydrated with the promotions, then we can just return those
    // as long as they have the translations joined.
    if (
      budget.promotions &&
      (budget.promotions.length === 0 || (budget.promotions.length > 0 && budget.promotions[0].translations))
    ) {
      return budget.promotions.map(p => this.translator.translate(p, ctx));
    }
    return this.budgetService.getBudgetPromotions(ctx, budget.id);
  }
}
