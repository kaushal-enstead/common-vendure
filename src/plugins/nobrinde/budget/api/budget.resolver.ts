import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ActiveOrderResult, ApplyCouponCodeResult } from '@vendure/common/lib/generated-shop-types';
import { CreateAddressInput, DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { BudgetService } from '../services/budget.service';
import {
  Allow,
  Ctx,
  Customer,
  CustomerService,
  ErrorResultUnion,
  isGraphQlErrorResult,
  Order,
  PaginatedList,
  RelationPaths,
  Relations,
  RequestContext,
  Transaction,
  UserInputError,
  Permission,
} from '@vendure/core';
import { Budget } from '../entity/budget';
import {
  BudgetMessage,
  MutationAddBudgetMessageArgs,
  MutationAddItemToBudgetOrderArgs,
  MutationAdjustBudgetOrderLineArgs,
  MutationApplyCouponCodeToBudgetOrderArgs,
  MutationDeleteBudgetOrderArgs,
  MutationModifyBudgetArgs,
  MutationRemoveBudgetOrderLineArgs,
  MutationRemoveCouponCodeFromBudgetOrderArgs,
  MutationSetBudgetOrderBillingAddressArgs,
  MutationSetBudgetOrderShippingAddressArgs,
  MutationSetCustomerForBudgetOrderArgs,
  MutationUnsetBudgetOrderBillingAddressArgs,
  MutationUnsetBudgetOrderShippingAddressArgs,
  QueryBudgetArgs,
  QueryBudgetsArgs,
  QueryGetBudgetMessagesArgs,
  RemoveBudgetItemsResult,
  UpdateBudgetItemsResult,
} from '../gql/generated';
import { BudgetPermissions } from '../constants';

@Resolver()
export class BudgetResolver {
  constructor(
    private budgetService: BudgetService,
    private customerService: CustomerService,
  ) {}

  @Query()
  @Allow(BudgetPermissions.Read)
  budgets(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryBudgetsArgs,
    @Relations(Budget) relations: RelationPaths<Budget>,
  ): Promise<PaginatedList<Budget>> {
    return this.budgetService.findAll(ctx, args.options || undefined, relations);
  }

  @Query()
  @Allow(BudgetPermissions.Read)
  async budget(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryBudgetArgs,
    @Relations({ entity: Budget, omit: [] })
    relations: RelationPaths<Budget>,
  ): Promise<Budget | undefined> {
    return this.budgetService.findOne(ctx, args.id, relations);
  }

  @Transaction()
  @Mutation()
  @Allow(BudgetPermissions.Create)
  async createBudgetOrder(@Ctx() ctx: RequestContext): Promise<Budget> {
    return this.budgetService.createDraft(ctx);
  }

  @Transaction()
  @Mutation()
  @Allow(BudgetPermissions.Delete)
  async deleteBudgetOrder(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationDeleteBudgetOrderArgs,
  ): Promise<DeletionResponse> {
    const budget = await this.budgetService.findOne(ctx, args.budgetId);
    if (!budget) {
      return {
        result: DeletionResult.NOT_DELETED,
        message: `No budget with the ID ${args.budgetId} was found`,
      };
    }
    try {
      await this.budgetService.deleteBudget(ctx, args.budgetId);
      return {
        result: DeletionResult.DELETED,
      };
    } catch (e: any) {
      return {
        result: DeletionResult.NOT_DELETED,
        message: e.message,
      };
    }
  }

  @Transaction()
  @Mutation()
  @Allow(BudgetPermissions.Create)
  async addItemToBudgetOrder(
    @Ctx() ctx: RequestContext,
    @Args() { budgetId, input }: MutationAddItemToBudgetOrderArgs,
  ): Promise<ErrorResultUnion<UpdateBudgetItemsResult, Budget>> {
    return this.budgetService.addItemToBudget(
      ctx,
      budgetId,
      input.productVariantId,
      input.quantity,
      (input as any).customFields,
    );
  }

  @Transaction()
  @Mutation()
  @Allow(BudgetPermissions.Update, Permission.Owner)
  async adjustBudgetOrderLine(
    @Ctx() ctx: RequestContext,
    @Args() { budgetId, input }: MutationAdjustBudgetOrderLineArgs,
  ): Promise<ErrorResultUnion<UpdateBudgetItemsResult, Budget>> {
    if (input.quantity === 0) {
      return this.removeBudgetOrderLine(ctx, { budgetId, budgetLineId: input.orderLineId });
    }
    return this.budgetService.adjustBudgetLine(
      ctx,
      budgetId,
      input.orderLineId,
      input.quantity,
      (input as any).customFields,
    );
  }

  @Transaction()
  @Mutation()
  @Allow(BudgetPermissions.Create)
  async removeBudgetOrderLine(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationRemoveBudgetOrderLineArgs,
  ): Promise<ErrorResultUnion<RemoveBudgetItemsResult, Budget>> {
    return this.budgetService.removeItemFromBudget(ctx, args.budgetId, args.budgetLineId);
  }

  @Transaction()
  @Mutation()
  @Allow(BudgetPermissions.Create)
  async setCustomerForBudgetOrder(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationSetCustomerForBudgetOrderArgs,
  ): Promise<ErrorResultUnion</* SetCustomerForDraftOrderResult*/ any, Budget>> {
    let customer: Customer;
    if (args.customerId) {
      const result = await this.customerService.findOne(ctx, args.customerId);
      if (!result) {
        throw new UserInputError(`No customer with the id "${args.customerId}" was found in this Channel`);
      }
      customer = result;
    } else if (args.input) {
      const result = await this.customerService.createOrUpdate(ctx, args.input as any, true);
      if (isGraphQlErrorResult(result)) {
        return result as any;
      }
      customer = result;
    } else {
      throw new UserInputError('Either "customerId" or "input" must be supplied to setCustomerForDraftOrder');
    }

    return this.budgetService.addCustomerToOrder(ctx, args.budgetId, customer);
  }

  @Transaction()
  @Mutation()
  @Allow(BudgetPermissions.Create)
  async setBudgetOrderShippingAddress(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationSetBudgetOrderShippingAddressArgs,
  ): Promise<Budget> {
    return this.budgetService.setShippingAddress(ctx, args.budgetId, args.input as CreateAddressInput);
  }

  @Transaction()
  @Mutation()
  @Allow(BudgetPermissions.Create)
  async setBudgetOrderBillingAddress(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationSetBudgetOrderBillingAddressArgs,
  ): Promise<ErrorResultUnion<ActiveOrderResult, Budget>> {
    return this.budgetService.setBillingAddress(ctx, args.budgetId, args.input as CreateAddressInput);
  }

  @Transaction()
  @Mutation()
  @Allow(BudgetPermissions.Create)
  async unsetBudgetOrderShippingAddress(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationUnsetBudgetOrderShippingAddressArgs,
  ): Promise<ErrorResultUnion<ActiveOrderResult, Budget>> {
    return this.budgetService.unsetShippingAddress(ctx, args.budgetId);
  }

  @Transaction()
  @Mutation()
  @Allow(BudgetPermissions.Create)
  async unsetBudgetOrderBillingAddress(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationUnsetBudgetOrderBillingAddressArgs,
  ): Promise<ErrorResultUnion<ActiveOrderResult, Budget>> {
    return this.budgetService.unsetBillingAddress(ctx, args.budgetId);
  }

  @Transaction()
  @Mutation()
  @Allow(BudgetPermissions.Create)
  async applyCouponCodeToBudgetOrder(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationApplyCouponCodeToBudgetOrderArgs,
  ): Promise<ErrorResultUnion<ApplyCouponCodeResult, Budget>> {
    return this.budgetService.applyCouponCode(ctx, args.budgetId, args.couponCode);
  }

  @Transaction()
  @Mutation()
  @Allow(BudgetPermissions.Create)
  async removeCouponCodeFromBudgetOrder(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationRemoveCouponCodeFromBudgetOrderArgs,
  ): Promise<Budget> {
    return this.budgetService.removeCouponCode(ctx, args.budgetId, args.couponCode);
  }

  @Query()
  @Allow(BudgetPermissions.Read)
  async getBudgetMessages(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryGetBudgetMessagesArgs,
  ): Promise<BudgetMessage[]> {
    return this.budgetService.getBudgetMessages(ctx, args.budgetId);
  }

  @Transaction()
  @Mutation()
  @Allow(BudgetPermissions.Create)
  async addBudgetMessage(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationAddBudgetMessageArgs,
  ): Promise<BudgetMessage> {
    return this.budgetService.addBudgetMessage(ctx, args.budgetId, args.content);
  }

  @Transaction()
  @Mutation()
  @Allow(BudgetPermissions.Update)
  async modifyBudget(@Ctx() ctx: RequestContext, @Args() args: MutationModifyBudgetArgs): Promise<Budget> {
    return this.budgetService.modifyBudget(ctx, args.budgetId, args.input);
  }

  //   @Query()
  //   @Allow(Permission.CreateOrder)
  //   async eligibleShippingMethodsForBudgetOrder(
  //     @Ctx() ctx: RequestContext,
  //     @Args() args: QueryEligibleShippingMethodsForDraftOrderArgs,
  //   ): Promise<ShippingMethodQuote[]> {
  //     return this.budgetService.getEligibleShippingMethods(ctx, args.orderId);
  //   }

  //   @Transaction()
  //   @Mutation()
  //   @Allow(Permission.CreateOrder)
  //   async setBudgetOrderShippingMethod(
  //     @Ctx() ctx: RequestContext,
  //     @Args() args: MutationSetDraftOrderShippingMethodArgs,
  //   ): Promise<ErrorResultUnion<SetOrderShippingMethodResult, Budget>> {
  //     return this.budgetService.setShippingMethod(ctx, args.orderId, [args.shippingMethodId]);
  //   }
}
