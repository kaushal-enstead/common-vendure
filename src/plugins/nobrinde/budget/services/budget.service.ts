import { Injectable } from '@nestjs/common';
import { ApplyCouponCodeResult, RemoveOrderItemsResult } from '@vendure/common/lib/generated-shop-types';
import {
  AdjustmentType,
  CreateAddressInput,
  OrderType,
  SetOrderCustomerInput,
} from '@vendure/common/lib/generated-types';
import { omit } from '@vendure/common/lib/omit';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import { summate } from '@vendure/common/lib/shared-utils';
import {
  assertFound,
  Channel,
  ChannelService,
  ConfigService,
  CountryService,
  Customer,
  CustomerService,
  ErrorResultUnion,
  idsAreEqual,
  Instrument,
  InsufficientStockError,
  isGraphQlErrorResult,
  JustErrorResults,
  ListQueryBuilder,
  ListQueryOptions,
  NegativeQuantityError,
  OrderCalculator,
  OrderInterceptorError,
  OrderLimitError,
  OrderLine,
  OrderModificationError,
  ProductVariant,
  ProductVariantService,
  Promotion,
  PromotionService,
  RelationPaths,
  RequestContext,
  TransactionalConnection,
  TranslatorService,
  UserInputError,
} from '@vendure/core';
import { EntityNotFoundError, IsNull } from 'typeorm';
import { FindOptionsUtils } from 'typeorm/find-options/FindOptionsUtils';
import { Budget, BudgetState, BudgetType } from '../entity/budget';
import { BudgetLine } from '../entity/budget-line';
import {
  BudgetListOptions,
  BudgetMessage,
  ModifyBudgetInput,
  RemoveBudgetItemsResult,
  UpdateBudgetItemsResult,
} from '../gql/generated';
import { BudgetModifier } from './budget-modifier';

/**
 * @description
 * Contains methods relating to {@link Budget} entities.
 *
 * @docsCategory services
 */
@Injectable()
@Instrument()
export class BudgetService {
  constructor(
    private connection: TransactionalConnection,
    private configService: ConfigService,
    private productVariantService: ProductVariantService,
    private customerService: CustomerService,
    private countryService: CountryService,
    private orderCalculator: OrderCalculator,
    private listQueryBuilder: ListQueryBuilder,
    private promotionService: PromotionService,
    private channelService: ChannelService,
    private budgetModifier: BudgetModifier,
    private translator: TranslatorService,
  ) {}

  findAll(
    ctx: RequestContext,
    options?: BudgetListOptions,
    relations?: RelationPaths<Budget>,
  ): Promise<PaginatedList<Budget>> {
    return this.listQueryBuilder
      .build(Budget, options as ListQueryOptions<Budget>, {
        ctx,
        relations: relations ?? [
          'lines',
          'customer',
          'lines.productVariant',
          'channels',
          // 'shippingLines',
          'payments',
        ],
        channelId: ctx.channelId,
        customPropertyMap: {
          customerLastName: 'customer.lastName',
          transactionId: 'payments.transactionId',
        },
      })
      .getManyAndCount()
      .then(([items, totalItems]) => {
        return {
          items,
          totalItems,
        };
      });
  }

  async findOne(
    ctx: RequestContext,
    budgetId: ID,
    relations?: RelationPaths<Budget>,
  ): Promise<Budget | undefined> {
    const qb = this.connection.getRepository(ctx, Budget).createQueryBuilder('b');
    // const effectiveRelations = relations ?? [
    const effectiveRelations = [
      'channels',
      'customer',
      'customer.user',
      'lines',
      'promotions',
      'lines.productVariant',
      'lines.productVariant.taxCategory',
      'lines.productVariant.productVariantPrices',
      'lines.productVariant.translations',
      'lines.featuredAsset',
      'lines.taxCategory',
      // 'shippingLines',
      // 'surcharges',
    ];
    if (
      relations &&
      effectiveRelations.includes('lines.productVariant') &&
      !effectiveRelations.includes('lines.productVariant.taxCategory')
    ) {
      effectiveRelations.push('lines.productVariant.taxCategory');
    }

    // Split relations into two groups for different loading strategies:
    // Main budget relations - loaded with 'query' strategy for performance
    const orderRelations = effectiveRelations.filter(r => !r.startsWith('lines'));

    // Lines relations - loaded with 'join' strategy to enable multi-column sorting
    const lineRelations = effectiveRelations
      .filter(r => r.startsWith('lines.'))
      .map(r => r.replace('lines.', ''));

    qb.setFindOptions({
      relations: orderRelations,
      relationLoadStrategy: 'query',
    })
      .leftJoin('b.channels', 'channel')
      .where('b.id = :budgetId', { budgetId })
      .andWhere('channel.id = :channelId', { channelId: ctx.channelId });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    FindOptionsUtils.joinEagerRelations(qb, qb.alias, qb.expressionMap.mainAlias!.metadata);
    const budget = await qb.getOne();

    if (budget) {
      const hasLinesRelations = effectiveRelations.some(r => r.startsWith('lines'));
      if (hasLinesRelations) {
        const linesQb = this.connection.getRepository(ctx, BudgetLine).createQueryBuilder('line');
        linesQb
          .setFindOptions({
            relations: lineRelations,
          })
          .where('line.budgetId = :budgetId', { budgetId })
          .addOrderBy('line.createdAt', 'ASC')
          .addOrderBy('line.productVariantId', 'ASC');

        const lines = await linesQb.getMany();
        budget.lines = lines;
      }

      if (effectiveRelations.includes('lines.productVariant')) {
        for (const line of budget.lines) {
          line.productVariant = this.translator.translate(
            await this.productVariantService.applyChannelPriceAndTax(line.productVariant, ctx, budget as any),
            ctx,
          );
        }
      }
      return budget;
    }
  }

  async findOneByCode(
    ctx: RequestContext,
    orderCode: string,
    relations?: RelationPaths<Budget>,
  ): Promise<Budget | undefined> {
    const budget = await this.connection.getRepository(ctx, Budget).findOne({
      relations: ['customer'],
      where: {
        code: orderCode,
      },
    });
    return budget ? this.findOne(ctx, budget.id, relations) : undefined;
  }

  async findOneByOrderLineId(
    ctx: RequestContext,
    orderLineId: ID,
    relations?: RelationPaths<Budget>,
  ): Promise<Budget | undefined> {
    const budget = await this.connection
      .getRepository(ctx, Budget)
      .createQueryBuilder('budget')
      .innerJoin('budget.lines', 'line', 'line.id = :orderLineId', { orderLineId })
      .getOne();

    return budget ? this.findOne(ctx, budget.id, relations) : undefined;
  }

  async findByCustomerId(
    ctx: RequestContext,
    customerId: ID,
    options?: ListQueryOptions<Budget>,
    relations?: RelationPaths<Budget>,
  ): Promise<PaginatedList<Budget>> {
    const effectiveRelations = (relations ?? ['lines', 'customer', 'channels', 'shippingLines']).filter(
      r =>
        // Don't join productVariant because it messes with the
        // price calculation in certain edge-case field resolver scenarios
        !r.includes('productVariant'),
    );
    return this.listQueryBuilder
      .build(Budget, options, {
        relations: relations ?? ['lines', 'customer', 'channels'],
        channelId: ctx.channelId,
        ctx,
      })
      .andWhere('budget.state != :draftState', { draftState: 'Draft' })
      .andWhere('budget.customer.id = :customerId', { customerId })
      .getManyAndCount()
      .then(([items, totalItems]) => {
        return {
          items,
          totalItems,
        };
      });
  }

  getSellerOrders(ctx: RequestContext, budget: Budget): Promise<Budget[]> {
    return this.connection.getRepository(ctx, Budget).find({
      where: {
        aggregateOrderId: budget.id,
      },
      relations: ['channels'],
    });
  }

  async getAggregateOrder(ctx: RequestContext, budget: Budget): Promise<Budget | undefined> {
    return budget.aggregateOrderId == null
      ? undefined
      : this.connection
          .getRepository(ctx, Budget)
          .findOne({ where: { id: budget.aggregateOrderId }, relations: ['channels', 'lines'] })
          .then(result => result ?? undefined);
  }

  getBudgetChannels(ctx: RequestContext, budget: Budget): Promise<Channel[]> {
    return this.connection
      .getRepository(ctx, Budget)
      .createQueryBuilder('budget')
      .relation('channels')
      .of(budget)
      .loadMany();
  }

  /**
   * @description
   * Returns any Budget associated with the specified User's Customer account
   * that is still in the `active` state.
   */
  async getActiveOrderForUser(ctx: RequestContext, userId: ID): Promise<Budget | undefined> {
    const customer = await this.customerService.findOneByUserId(ctx, userId);
    if (customer) {
      const activeOrder = await this.connection
        .getRepository(ctx, Budget)
        .createQueryBuilder('budget')
        .innerJoinAndSelect('budget.channels', 'channel', 'channel.id = :channelId', {
          channelId: ctx.channelId,
        })
        .leftJoinAndSelect('budget.customer', 'customer')
        // .leftJoinAndSelect('budget.shippingLines', 'shippingLines')
        .where('budget.active = :active', { active: true })
        .andWhere('budget.customer.id = :customerId', { customerId: customer.id })
        .orderBy('budget.createdAt', 'DESC')
        .getOne();
      if (activeOrder) {
        return this.findOne(ctx, activeOrder.id);
      }
    }
  }

  /**
   * @description
   * Creates a new, empty Budget. If a `userId` is passed, the Budget will get associated with that
   * User's Customer account.
   */
  async create(ctx: RequestContext, userId?: ID): Promise<Budget> {
    const newOrder = await this.createEmptyOrderEntity(ctx);
    if (userId) {
      const customer = await this.customerService.findOneByUserId(ctx, userId);
      if (customer) {
        newOrder.customer = customer;
      }
    }
    await this.channelService.assignToCurrentChannel(newOrder, ctx);
    const budget = await this.connection.getRepository(ctx, Budget).save(newOrder);
    return budget;
  }

  async createDraft(ctx: RequestContext) {
    const newOrder = await this.createEmptyOrderEntity(ctx);
    newOrder.active = false;
    await this.channelService.assignToCurrentChannel(newOrder, ctx);
    const budget = await this.connection.getRepository(ctx, Budget).save(newOrder);
    return budget;
  }

  private async createEmptyOrderEntity(ctx: RequestContext) {
    const type = ctx.apiType === 'admin' ? BudgetType.Admin : BudgetType.Customer;
    return new Budget({
      type,
      code: await this.configService.orderOptions.orderCodeStrategy.generate(ctx),
      state: BudgetState.Pending,
      lines: [],
      // surcharges: [],
      couponCodes: [],
      //   modifications: [],
      shippingAddress: {},
      billingAddress: {},
      subTotal: 0,
      subTotalWithTax: 0,
      currencyCode: ctx.currencyCode,
    });
  }

  /**
   * @description
   * Updates the Customer which is assigned to a given Budget. The target Customer must be assigned to the same
   * Channels as the Budget, otherwise an error will be thrown.
   *
   * @since 2.2.0
   */
  async updateBudgetCustomer(ctx: RequestContext, { customerId, orderId, note }: SetOrderCustomerInput) {
    const budget = await this.getBudgetOrThrow(ctx, orderId, ['channels', 'customer']);
    const currentCustomer = budget.customer;
    if (currentCustomer?.id === customerId) {
      // No change in customer, so just return the order as-is
      return budget;
    }
    const targetCustomer = await this.customerService.findOne(ctx, customerId, ['channels']);
    if (!targetCustomer) {
      throw new EntityNotFoundError('Customer', customerId);
    }

    // ensure the customer is assigned to the same channels as the budget
    const channelIds = budget.channels.map(c => c.id);
    const customerChannelIds = targetCustomer.channels.map(c => c.id);
    const missingChannelIds = channelIds.filter(id => !customerChannelIds.includes(id));
    if (missingChannelIds.length) {
      throw new UserInputError(`error.target-customer-not-assigned-to-budget-channels`, {
        channelIds: missingChannelIds.join(', '),
      });
    }

    const updatedOrder = await this.addCustomerToOrder(ctx, budget.id, targetCustomer);
    return updatedOrder;
  }

  /**
   * @description
   * Adds an item to the Budget, either creating a new OrderLine or
   * incrementing an existing one.
   *
   * If you need to add multiple items to an Budget, use `addItemsToOrder()` instead.
   */
  async addItemToBudget(
    ctx: RequestContext,
    budgetId: ID,
    productVariantId: ID,
    quantity: number,
    customFields?: { [key: string]: any },
    relations?: RelationPaths<Budget>,
  ): Promise<ErrorResultUnion<UpdateBudgetItemsResult, Budget>> {
    const result = await this.addItemsToBudget(
      ctx,
      budgetId,
      [{ productVariantId, quantity, customFields }],
      relations,
    );
    if (result.errorResults.length) {
      return result.errorResults[0];
    } else {
      return result.budget;
    }
  }

  /**
   * @description
   * Adds multiple items to an Budget. This method is more efficient than calling `addItemToOrder`
   * multiple times, as it only needs to fetch the entire Budget once, and only performs
   * price adjustments once at the end.
   *
   * Since this method can return multiple error results, it is recommended to check the `errorResults`
   * array to determine if any errors occurred.
   *
   * @since 3.1.0
   */
  async addItemsToBudget(
    ctx: RequestContext,
    budgetId: ID,
    items: Array<{
      productVariantId: ID;
      quantity: number;
      customFields?: { [key: string]: any };
    }>,
    relations?: RelationPaths<Budget>,
  ): Promise<{ budget: Budget; errorResults: Array<JustErrorResults<UpdateBudgetItemsResult>> }> {
    const budget = await this.getBudgetOrThrow(ctx, budgetId);

    const errorResults: Array<JustErrorResults<UpdateBudgetItemsResult>> = [];
    const updatedBudgetLines: BudgetLine[] = [];
    addItem: for (const item of items) {
      const { productVariantId, quantity, customFields } = item;
      const existingBudgetLine = await this.budgetModifier.getExistingBudgetLine(
        ctx,
        budget as any,
        productVariantId,
        customFields,
      );

      const validationError =
        this.assertQuantityIsPositive(quantity) ||
        this.assertAddingItemsState(budget) ||
        this.assertNotOverOrderItemsLimit(budget, quantity) ||
        this.assertNotOverOrderLineItemsLimit(existingBudgetLine, quantity);
      if (validationError) {
        errorResults.push(validationError);
        continue;
      }
      const variant = await this.connection.getEntityOrThrow(ctx, ProductVariant, productVariantId, {
        relations: ['product'],
        where: {
          enabled: true,
          deletedAt: IsNull(),
        },
        loadEagerRelations: false,
      });
      if (variant.product.enabled === false) {
        throw new EntityNotFoundError('ProductVariant', productVariantId);
      }
      const existingQuantityInOtherLines = summate(
        budget.lines.filter(
          l =>
            idsAreEqual(l.productVariantId, productVariantId) && !idsAreEqual(l.id, existingBudgetLine?.id),
        ),
        'quantity',
      );

      const correctedQuantity = await this.budgetModifier.constrainQuantityToSaleable(
        ctx,
        variant,
        quantity,
        existingBudgetLine?.quantity,
        existingQuantityInOtherLines,
      );

      if (correctedQuantity === 0) {
        errorResults.push(
          new InsufficientStockError({ order: budget, quantityAvailable: correctedQuantity }),
        );
        continue;
      }
      const { orderInterceptors } = this.configService.orderOptions;
      for (const interceptor of orderInterceptors) {
        if (interceptor.willAddItemToOrder) {
          const error = await interceptor.willAddItemToOrder(ctx, budget as any, {
            productVariant: variant,
            quantity: correctedQuantity,
            customFields,
          });
          if (error) {
            errorResults.push(new OrderInterceptorError({ interceptorError: error }));
            continue addItem;
          }
        }
      }
      const budgetLine = await this.budgetModifier.getOrCreateBudgetLine(
        ctx,
        budget,
        productVariantId,
        customFields,
      );

      if (correctedQuantity < quantity) {
        const newQuantity = (existingBudgetLine ? existingBudgetLine?.quantity : 0) + correctedQuantity;
        await this.budgetModifier.updateBudgetLineQuantity(ctx, budgetLine, newQuantity, budget);
      } else {
        await this.budgetModifier.updateBudgetLineQuantity(ctx, budgetLine, correctedQuantity, budget);
      }
      updatedBudgetLines.push(budgetLine);
      const quantityWasAdjustedDown = correctedQuantity < quantity;
      if (quantityWasAdjustedDown) {
        errorResults.push(
          new InsufficientStockError({ quantityAvailable: correctedQuantity, order: budget as any }),
        );
        continue;
      }
    }
    const updatedBudget = await this.applyPriceAdjustments(ctx, budget, updatedBudgetLines, relations);
    // for any InsufficientStockError errors, we want to make sure we use the final updatedOrder
    // after having applied all price adjustments
    for (const [i, errorResult] of Object.entries(errorResults)) {
      if (errorResult.__typename === 'InsufficientStockError') {
        errorResults[+i] = new InsufficientStockError({
          quantityAvailable: errorResult.quantityAvailable,
          order: updatedBudget,
        });
      }
    }

    return {
      budget: updatedBudget,
      errorResults,
    };
  }

  /**
   * @description
   * Adjusts the quantity and/or custom field values of an existing OrderLine.
   *
   * If you need to adjust multiple OrderLines, use `adjustOrderLines()` instead.
   */
  async adjustBudgetLine(
    ctx: RequestContext,
    budgetId: ID,
    orderLineId: ID,
    quantity: number,
    customFields?: { [key: string]: any },
    relations?: RelationPaths<Budget>,
  ): Promise<ErrorResultUnion<UpdateBudgetItemsResult, Budget>> {
    const result = await this.adjustBudgetLines(
      ctx,
      budgetId,
      [{ orderLineId, quantity, customFields }],
      relations,
    );
    if (result.errorResults.length) {
      return result.errorResults[0];
    } else {
      return result.budget;
    }
  }

  /**
   * @description
   * Adjusts the quantity and/or custom field values of existing OrderLines.
   * This method is more efficient than calling `adjustOrderLine` multiple times, as it only needs to fetch
   * the entire Budget once, and only performs price adjustments once at the end.
   * Since this method can return multiple error results, it is recommended to check the `errorResults`
   * array to determine if any errors occurred.
   *
   * @since 3.1.0
   */
  async adjustBudgetLines(
    ctx: RequestContext,
    budgetId: ID,
    lines: Array<{ orderLineId: ID; quantity: number; customFields?: { [key: string]: any } }>,
    relations?: RelationPaths<Budget>,
  ): Promise<{ budget: Budget; errorResults: Array<JustErrorResults<UpdateBudgetItemsResult>> }> {
    const budget = await this.getBudgetOrThrow(ctx, budgetId);
    const errorResults: Array<JustErrorResults<UpdateBudgetItemsResult>> = [];
    const updatedBudgetLines: BudgetLine[] = [];
    adjustLine: for (const line of lines) {
      const { orderLineId, quantity, customFields } = line;
      const budgetLine = this.getBudgetLineOrThrow(budget, orderLineId);
      const validationError =
        this.assertAddingItemsState(budget) ||
        this.assertQuantityIsPositive(quantity) ||
        this.assertNotOverOrderItemsLimit(budget, quantity - budgetLine.quantity) ||
        this.assertNotOverOrderLineItemsLimit(budgetLine, quantity - budgetLine.quantity);
      if (validationError) {
        errorResults.push(validationError);
        continue;
      }
      const { orderInterceptors } = this.configService.orderOptions;
      for (const interceptor of orderInterceptors) {
        if (interceptor.willAdjustOrderLine) {
          const error = await interceptor.willAdjustOrderLine(ctx, budget as any, {
            orderLine: budgetLine as any,
            quantity,
            customFields,
          });
          if (error) {
            errorResults.push(new OrderInterceptorError({ interceptorError: error }));
            continue adjustLine;
          }
        }
      }

      const existingQuantityInOtherLines = summate(
        budget.lines.filter(
          l =>
            idsAreEqual(l.productVariantId, budgetLine.productVariantId) && !idsAreEqual(l.id, orderLineId),
        ),
        'quantity',
      );
      const correctedQuantity = await this.budgetModifier.constrainQuantityToSaleable(
        ctx,
        budgetLine.productVariant,
        quantity,
        0,
        existingQuantityInOtherLines,
      );
      if (correctedQuantity === 0) {
        budget.lines = budget.lines.filter(l => !idsAreEqual(l.id, budgetLine.id));
        const deletedBudgetLine = new BudgetLine(budgetLine);
        await this.connection.getRepository(ctx, BudgetLine).remove(budgetLine);
      } else {
        await this.budgetModifier.updateBudgetLineQuantity(ctx, budgetLine, correctedQuantity, budget);
        await this.connection.getRepository(ctx, BudgetLine).save(budgetLine);
        updatedBudgetLines.push(budgetLine);
      }
      const quantityWasAdjustedDown = correctedQuantity < quantity;

      if (quantityWasAdjustedDown) {
        errorResults.push(
          new InsufficientStockError({
            quantityAvailable: correctedQuantity,
            order: budget as any,
          }),
        );
      }
    }
    const updatedBudget = await this.applyPriceAdjustments(ctx, budget, updatedBudgetLines, relations);
    for (const [i, errorResult] of Object.entries(errorResults)) {
      if (errorResult.__typename === 'InsufficientStockError') {
        errorResults[+i] = new InsufficientStockError({
          quantityAvailable: errorResult.quantityAvailable,
          order: updatedBudget,
        });
      }
    }
    return {
      budget: updatedBudget,
      errorResults,
    };
  }

  /**
   * @description
   * Removes the specified BudgetLine from the Budget.
   *
   * If you need to remove multiple BudgetLines, use `removeItemsFromOrder()` instead.
   */
  async removeItemFromBudget(
    ctx: RequestContext,
    budgetId: ID,
    budgetLineId: ID,
  ): Promise<ErrorResultUnion<RemoveBudgetItemsResult, Budget>> {
    return this.removeItemsFromBudget(ctx, budgetId, [budgetLineId]);
  }

  /**
   * @description
   * Removes the specified BudgetLines from the Budget.
   * This method is more efficient than calling `removeItemFromBudget` multiple times, as it only needs to fetch
   * the entire Budget once, and only performs price adjustments once at the end.
   *
   * @since 3.1.0
   */
  async removeItemsFromBudget(
    ctx: RequestContext,
    budgetId: ID,
    budgetLineIds: ID[],
  ): Promise<ErrorResultUnion<RemoveBudgetItemsResult, Budget>> {
    const budget = await this.getBudgetOrThrow(ctx, budgetId);
    const validationError = this.assertAddingItemsState(budget);
    if (validationError) {
      return validationError;
    }
    const budgetLinesToDelete: BudgetLine[] = [];
    for (const budgetLineId of budgetLineIds) {
      const budgetLine = this.getBudgetLineOrThrow(budget, budgetLineId);
      const { orderInterceptors } = this.configService.orderOptions;
      for (const interceptor of orderInterceptors) {
        if (interceptor.willRemoveItemFromOrder) {
          const error = await interceptor.willRemoveItemFromOrder(ctx, budget as any, budgetLine as any);
          if (error) {
            return new OrderInterceptorError({ interceptorError: error });
          }
        }
      }
      budgetLinesToDelete.push(budgetLine);
    }

    budget.lines = budget.lines.filter(line => !budgetLineIds.find(blId => idsAreEqual(line.id, blId)));
    // Persist the budgetLine removal before applying price adjustments
    // so that any hydration of the Budget entity during the course of the
    // `applyPriceAdjustments()` (e.g. in a ShippingEligibilityChecker etc)
    // will not re-add the BudgetLine.
    await this.connection.getRepository(ctx, Budget).save(budget, { reload: false });
    const updatedBudget = await this.applyPriceAdjustments(ctx, budget);
    for (const budgetLine of budgetLinesToDelete) {
      await this.connection.getRepository(ctx, BudgetLine).remove(budgetLine);
    }
    return updatedBudget;
  }

  /**
   * @description
   * Removes all BudgetLines from the Budget.
   */
  async removeAllItemsFromBudget(
    ctx: RequestContext,
    budgetId: ID,
  ): Promise<ErrorResultUnion<RemoveOrderItemsResult, Budget>> {
    const budget = await this.getBudgetOrThrow(ctx, budgetId);
    const validationError = this.assertAddingItemsState(budget);
    if (validationError) {
      return validationError;
    }

    const { orderInterceptors } = this.configService.orderOptions;
    for (const budgetLine of budget.lines) {
      for (const interceptor of orderInterceptors) {
        if (interceptor.willRemoveItemFromOrder) {
          const error = await interceptor.willRemoveItemFromOrder(ctx, budget as any, budgetLine as any);
          if (error) {
            return new OrderInterceptorError({ interceptorError: error });
          }
        }
      }
    }

    await this.connection.getRepository(ctx, BudgetLine).remove(budget.lines);
    budget.lines = [];
    const updatedBudget = await this.applyPriceAdjustments(ctx, budget);
    return updatedBudget;
  }

  /**
   * @description
   * Applies a coupon code to the Budget, which should be a valid coupon code as specified in the configuration
   * of an active {@link Promotion}.
   */
  async applyCouponCode(
    ctx: RequestContext,
    budgetId: ID,
    couponCode: string,
  ): Promise<ErrorResultUnion<ApplyCouponCodeResult, Budget>> {
    const budget = await this.getBudgetOrThrow(ctx, budgetId);
    if (budget.couponCodes.includes(couponCode)) {
      return budget;
    }
    const validationResult = await this.promotionService.validateCouponCode(
      ctx,
      couponCode,
      budget.customer && budget.customer.id,
    );
    if (isGraphQlErrorResult(validationResult)) {
      return validationResult;
    }
    budget.couponCodes.push(couponCode);
    return this.applyPriceAdjustments(ctx, budget);
  }

  async getBudgetPromotions(ctx: RequestContext, budgetId: ID): Promise<Promotion[]> {
    const budget = await this.connection.getEntityOrThrow(ctx, Budget, budgetId, {
      channelId: ctx.channelId,
      relations: ['promotions'],
    });
    return budget.promotions.map(p => this.translator.translate(p, ctx)) || [];
  }

  /**
   * @description
   * Removes a coupon code from the Budget.
   */
  async removeCouponCode(ctx: RequestContext, budgetId: ID, couponCode: string) {
    const budget = await this.getBudgetOrThrow(ctx, budgetId);
    if (budget.couponCodes.includes(couponCode)) {
      // When removing a couponCode which has triggered an Budget-level discount
      // we need to make sure we persist the changes to the adjustments array of
      // any affected OrderLines.
      const affectedBudgetLines = budget.lines.filter(
        line => line.adjustments.filter(a => a.type === AdjustmentType.DISTRIBUTED_ORDER_PROMOTION).length,
      );
      budget.couponCodes = budget.couponCodes.filter(cc => cc !== couponCode);
      const result = await this.applyPriceAdjustments(ctx, budget);
      await this.connection.getRepository(ctx, BudgetLine).save(affectedBudgetLines);
      return result;
    } else {
      return budget;
    }
  }

  /**
   * @description
   * Returns all {@link Promotion}s associated with an Budget.
   */
  // async getBudgetPromotions(ctx: RequestContext, budgetId: ID): Promise<Promotion[]> {
  //   const budget = await this.connection.getEntityOrThrow(ctx, Budget, budgetId, {
  //     channelId: ctx.channelId,
  //     relations: ['promotions'],
  //   });
  //   return budget.promotions.map(p => this.translator.translate(p, ctx)) || [];
  // }

  /**
   * @description
   * Sets the shipping address for the Budget.
   */
  async setShippingAddress(ctx: RequestContext, budgetId: ID, input: CreateAddressInput): Promise<Budget> {
    const budget = await this.getBudgetOrThrow(ctx, budgetId);
    const country = await this.countryService.findOneByCode(ctx, input.countryCode);
    const shippingAddress = { ...input, countryCode: input.countryCode, country: country.name };
    await this.connection
      .getRepository(ctx, Budget)
      .createQueryBuilder('budget')
      .update(Budget)
      .set({ shippingAddress })
      .where('id = :id', { id: budget.id })
      .execute();
    budget.shippingAddress = shippingAddress;
    // Since a changed ShippingAddress could alter the activeTaxZone,
    // we will remove any cached activeTaxZone, so it can be re-calculated
    // as needed.
    // this.requestCache.set(ctx, CacheKey.ActiveTaxZone, undefined);
    // this.requestCache.set(ctx, CacheKey.ActiveTaxZone_PPA, undefined);
    return this.applyPriceAdjustments(ctx, budget, budget.lines);
  }

  /**
   * @description
   * Sets the billing address for the Budget.
   */
  async setBillingAddress(ctx: RequestContext, budgetId: ID, input: CreateAddressInput): Promise<Budget> {
    const budget = await this.getBudgetOrThrow(ctx, budgetId);
    const country = await this.countryService.findOneByCode(ctx, input.countryCode);
    const billingAddress = { ...input, countryCode: input.countryCode, country: country.name };
    await this.connection
      .getRepository(ctx, Budget)
      .createQueryBuilder('budget')
      .update(Budget)
      .set({ billingAddress })
      .where('id = :id', { id: budget.id })
      .execute();
    budget.billingAddress = billingAddress;
    // Since a changed BillingAddress could alter the activeTaxZone,
    // we will remove any cached activeTaxZone, so it can be re-calculated
    // as needed.
    // this.requestCache.set(ctx, CacheKey.ActiveTaxZone, undefined);
    // this.requestCache.set(ctx, CacheKey.ActiveTaxZone_PPA, undefined);
    return this.applyPriceAdjustments(ctx, budget, budget.lines);
  }

  /**
   * @description
   * Unsets the shipping address for the Budget.
   *
   * @since 3.1.0
   */
  async unsetShippingAddress(ctx: RequestContext, budgetId: ID): Promise<Budget> {
    const budget = await this.getBudgetOrThrow(ctx, budgetId);
    await this.connection
      .getRepository(ctx, Budget)
      .createQueryBuilder('budget')
      .update(Budget)
      .set({ shippingAddress: {} })
      .where('id = :id', { id: budget.id })
      .execute();
    budget.shippingAddress = {};
    // Since a changed ShippingAddress could alter the activeTaxZone,
    // we will remove any cached activeTaxZone, so it can be re-calculated
    // as needed.
    // this.requestCache.set(ctx, CacheKey.ActiveTaxZone, undefined);
    // this.requestCache.set(ctx, CacheKey.ActiveTaxZone_PPA, undefined);
    return this.applyPriceAdjustments(ctx, budget, budget.lines);
  }

  /**
   * @description
   * Unsets the billing address for the Budget.
   *
   * @since 3.1.0
   */
  async unsetBillingAddress(ctx: RequestContext, budgetId: ID): Promise<Budget> {
    const budget = await this.getBudgetOrThrow(ctx, budgetId);
    await this.connection
      .getRepository(ctx, Budget)
      .createQueryBuilder('budget')
      .update(Budget)
      .set({ billingAddress: {} })
      .where('id = :id', { id: budget.id })
      .execute();
    budget.billingAddress = {};
    // Since a changed BillingAddress could alter the activeTaxZone,
    // we will remove any cached activeTaxZone, so it can be re-calculated
    // as needed.
    // this.requestCache.set(ctx, CacheKey.ActiveTaxZone, undefined);
    // this.requestCache.set(ctx, CacheKey.ActiveTaxZone_PPA, undefined);
    return this.applyPriceAdjustments(ctx, budget, budget.lines);
  }

  /**
   * @description
   * Associates a Customer with the Budget.
   */
  async addCustomerToOrder(
    ctx: RequestContext,
    budgetIdOrBudget: ID | Budget,
    customer: Customer,
  ): Promise<Budget> {
    const budget =
      budgetIdOrBudget instanceof Budget
        ? budgetIdOrBudget
        : await this.getBudgetOrThrow(ctx, budgetIdOrBudget);
    budget.customer = customer;
    await this.connection.getRepository(ctx, Budget).save(budget, { reload: false });
    let updatedBudget = budget;
    // Check that any applied couponCodes are still valid now that
    // we know the Customer.
    if (budget.active && budget.couponCodes) {
      for (const couponCode of budget.couponCodes.slice()) {
        const validationResult = await this.promotionService.validateCouponCode(ctx, couponCode, customer.id);
        if (isGraphQlErrorResult(validationResult)) {
          updatedBudget = await this.removeCouponCode(ctx, budget.id, couponCode);
        }
      }
    }
    return updatedBudget;
  }

  async modifyBudget(ctx: RequestContext, budgetId: ID, input: ModifyBudgetInput): Promise<Budget> {
    const budget = await this.getBudgetOrThrow(ctx, budgetId, []);
    budget.state = input.state as BudgetState;
    await this.connection.getRepository(ctx, Budget).save(budget);
    return budget;
  }

  async getBudgetMessages(ctx: RequestContext, budgetId: ID): Promise<BudgetMessage[]> {
    const budget = await this.getBudgetOrThrow(ctx, budgetId, []);
    return budget.messages ?? [];
  }

  async addBudgetMessage(ctx: RequestContext, budgetId: ID, content: string): Promise<BudgetMessage> {
    const budget = await this.getBudgetOrThrow(ctx, budgetId, []);
    const newMessage: BudgetMessage = {
      id: `msg-${Date.now()}`,
      content,
      sender: ctx.apiType === 'shop' ? 'CUSTOMER' : 'SELLER',
      timestamp: new Date(),
      senderId: ctx.activeUserId as string,
      budgetId: budget.id as string,
    };
    if (!budget.messages) {
      budget.messages = [];
    }
    budget.messages.push(newMessage as never);
    await this.connection.getRepository(ctx, Budget).save(budget);
    return newMessage;
  }

  /**
   * @description
   * Deletes an Budget, ensuring that any Sessions that reference this Budget are dereferenced before deletion.
   *
   * @since 1.5.0
   */
  async deleteBudget(ctx: RequestContext, budgetOrId: ID | Budget) {
    const budgetToDelete =
      budgetOrId instanceof Budget
        ? budgetOrId
        : await this.connection
            .getRepository(ctx, Budget)
            .findOneOrFail({ where: { id: budgetOrId }, relations: ['lines'] });

    const deletedBudget = new Budget(budgetToDelete);
    await this.connection.getRepository(ctx, Budget).delete(budgetToDelete.id);
  }

  private async getBudgetOrThrow(
    ctx: RequestContext,
    budgetId: ID,
    relations?: RelationPaths<Budget>,
  ): Promise<Budget> {
    const budget = await this.findOne(
      ctx,
      budgetId,
      relations ?? [
        'lines',
        'lines.productVariant',
        'lines.productVariant.productVariantPrices',
        // 'shippingLines',
        // 'surcharges',
        'customer',
      ],
    );
    if (!budget) {
      throw new EntityNotFoundError('Budget', budgetId);
    }
    return budget;
  }

  private getBudgetLineOrThrow(budget: Budget, budgetLineId: ID): BudgetLine {
    const budgetLine = budget.lines.find(line => idsAreEqual(line.id, budgetLineId));
    if (!budgetLine) {
      throw new UserInputError('error.budget-does-not-contain-line-with-id', { id: budgetLineId });
    }
    return budgetLine;
  }

  /**
   * Returns error if quantity is negative.
   */
  private assertQuantityIsPositive(quantity: number) {
    if (quantity < 0) {
      return new NegativeQuantityError();
    }
  }

  /**
   * Returns error if the Budget is not in the "AddingItems" or "Draft" state.
   */
  private assertAddingItemsState(budget: Budget) {
    // if (budget.state !== 'AddingItems' && budget.state !== 'Draft') {
    //   return new OrderModificationError();
    // }
    return undefined;
  }

  /**
   * Throws if adding the given quantity would take the total budget items over the
   * maximum limit specified in the config.
   */
  private assertNotOverOrderItemsLimit(budget: Budget, quantityToAdd: number) {
    const currentItemsCount = summate(budget.lines, 'quantity');
    const { orderItemsLimit } = this.configService.orderOptions;
    if (orderItemsLimit < currentItemsCount + quantityToAdd) {
      return new OrderLimitError({ maxItems: orderItemsLimit });
    }
  }

  /**
   * Throws if adding the given quantity would exceed the maximum allowed
   * quantity for one budget line.
   */
  private assertNotOverOrderLineItemsLimit(
    budgetLine: BudgetLine | OrderLine | undefined,
    quantityToAdd: number,
  ) {
    const currentQuantity = budgetLine?.quantity || 0;
    const { orderLineItemsLimit } = this.configService.orderOptions;
    if (orderLineItemsLimit < currentQuantity + quantityToAdd) {
      return new OrderLimitError({ maxItems: orderLineItemsLimit });
    }
  }

  async getActivePromotionsOnBudget(ctx: RequestContext, budgetId: ID): Promise<Promotion[]> {
    const budget = await this.connection
      .getRepository(ctx, Budget)
      .createQueryBuilder('budget')
      .leftJoinAndSelect('budget.promotions', 'promotions')
      .where('budget.id = :budgetId', { budgetId })
      .getOne();
    return budget?.promotions ?? [];
  }

  /**
   * @description
   * Applies promotions, taxes and shipping to the Budget. If the `updatedOrderLines` argument is passed in,
   * then all of those OrderLines will have their prices re-calculated using the configured {@link OrderItemPriceCalculationStrategy}.
   */
  async applyPriceAdjustments(
    ctx: RequestContext,
    budget: Budget,
    updatedBudgetLines?: BudgetLine[],
    relations?: RelationPaths<Budget>,
  ): Promise<Budget> {
    const promotions = await this.promotionService.getActivePromotionsInChannel(ctx);
    const activePromotionsPre = await this.getActivePromotionsOnBudget(ctx, budget.id);

    // When changing the Budget's currencyCode (on account of passing
    // a different currencyCode into the RequestContext), we need to make sure
    // to update all existing OrderLines to use prices in this new currency.
    if (ctx.currencyCode !== budget.currencyCode) {
      updatedBudgetLines = budget.lines;
      budget.currencyCode = ctx.currencyCode;
    }

    if (updatedBudgetLines?.length) {
      const { orderItemPriceCalculationStrategy, changedPriceHandlingStrategy } =
        this.configService.orderOptions;
      for (const updatedBudgetLine of updatedBudgetLines) {
        const variant = await this.productVariantService.applyChannelPriceAndTax(
          updatedBudgetLine.productVariant,
          ctx,
          budget as any,
        );
        let priceResult = await orderItemPriceCalculationStrategy.calculateUnitPrice(
          ctx,
          variant,
          {},
          budget as any,
          updatedBudgetLine.quantity,
        );
        const initialListPrice = updatedBudgetLine.initialListPrice ?? priceResult.price;
        if (initialListPrice !== priceResult.price) {
          priceResult = await changedPriceHandlingStrategy.handlePriceChange(
            ctx,
            priceResult,
            updatedBudgetLine as any,
            budget as any,
          );
        }

        if (updatedBudgetLine.initialListPrice == null) {
          updatedBudgetLine.initialListPrice = initialListPrice;
        }
        updatedBudgetLine.listPrice = priceResult.price;
        updatedBudgetLine.listPriceIncludesTax = priceResult.priceIncludesTax;
      }
    }

    const updatedBudget = await this.orderCalculator.applyPriceAdjustments(
      ctx,
      { ...budget, surcharges: [], shippingLines: [] } as any,
      promotions,
      (updatedBudgetLines ?? []) as any,
    );

    // Explicitly omit the shippingAddress and billingAddress properties to avoid
    // a race condition where changing one or the other in parallel can
    // overwrite the other's changes. The other omissions prevent the save
    // function from doing more work than necessary.
    await this.connection.getRepository(ctx, Budget).save(
      omit(updatedBudget as any, [
        'shippingAddress',
        'billingAddress',
        'lines',
        // 'shippingLines',
        'aggregateOrder',
        'sellerOrders',
        'customer',
        // 'modifications',
        // 'customFields',
      ]),
      {
        reload: false,
      },
    );
    await this.connection.getRepository(ctx, BudgetLine).save(updatedBudget.lines, { reload: false });
    // await this.connection.getRepository(ctx, ShippingLine).save(budget.shippingLines, { reload: false });
    await this.promotionService.runPromotionSideEffects(ctx, budget as any, activePromotionsPre);

    return assertFound(this.findOne(ctx, budget.id, relations));
  }
}
