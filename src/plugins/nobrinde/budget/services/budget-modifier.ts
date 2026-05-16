import { Injectable } from '@nestjs/common';
import { ID } from '@vendure/common/lib/shared-types';
import {
  ConfigService,
  CustomFieldConfig,
  idsAreEqual,
  Instrument,
  ProductVariant,
  ProductVariantService,
  RequestContext,
  TransactionalConnection,
} from '@vendure/core';
import { EntityNotFoundError, IsNull } from 'typeorm';
import { BudgetLine } from '../entity/budget-line';
import { Budget } from '../entity/budget';

/**
 * @description
 * This helper is responsible for modifying the contents of an Order.
 *
 * Note:
 * There is not a clear separation of concerns between the OrderService and this, since
 * the OrderService also contains some method which modify the Order (e.g. removeItemFromOrder).
 * So this helper was mainly extracted to isolate the huge `modifyOrder` method since the
 * OrderService was just growing too large. Future refactoring could improve the organization
 * of these Order-related methods into a more clearly-delineated set of classes.
 *
 * @docsCategory service-helpers
 */
@Injectable()
@Instrument()
export class BudgetModifier {
  constructor(
    private connection: TransactionalConnection,
    private configService: ConfigService,
    private productVariantService: ProductVariantService,
  ) {}

  /**
   * @description
   * Ensure that the ProductVariant has sufficient saleable stock to add the given
   * quantity to an Order.
   *
   * - `existingOrderLineQuantity` is used when adding an item to the order, since if an OrderLine
   * already exists then we will be adding the new quantity to the existing quantity.
   * - `quantityInOtherOrderLines` is used when we have more than 1 OrderLine containing the same
   * ProductVariant. This occurs when there are custom fields defined on the OrderLine and the lines
   * have differing values for one or more custom fields. In this case, we need to take _all_ of these
   * OrderLines into account when constraining the quantity. See https://github.com/vendure-ecommerce/vendure/issues/2702
   * for more on this.
   */
  async constrainQuantityToSaleable(
    ctx: RequestContext,
    variant: ProductVariant,
    quantity: number,
    existingOrderLineQuantity = 0,
    quantityInOtherOrderLines = 0,
  ) {
    let correctedQuantity = quantity + existingOrderLineQuantity;
    const saleableStockLevel = await this.productVariantService.getSaleableStockLevel(ctx, variant);
    if (saleableStockLevel < correctedQuantity + quantityInOtherOrderLines) {
      correctedQuantity = Math.max(
        saleableStockLevel - existingOrderLineQuantity - quantityInOtherOrderLines,
        0,
      );
    }
    return correctedQuantity;
  }

  /**
   * @description
   * Given a ProductVariant ID and optional custom fields, this method will return an existing OrderLine that
   * matches, or `undefined` if no match is found.
   */
  async getExistingBudgetLine(
    ctx: RequestContext,
    budget: Budget,
    productVariantId: ID,
    customFields?: { [key: string]: any },
  ): Promise<BudgetLine | undefined> {
    for (const line of budget.lines) {
      const match = idsAreEqual(line.productVariantId, productVariantId);
      if (match) {
        return line;
      }
    }
  }

  /**
   * @description
   * Returns the OrderLine containing the given {@link ProductVariant}, taking into account any custom field values. If no existing
   * OrderLine is found, a new OrderLine will be created.
   */
  async getOrCreateBudgetLine(
    ctx: RequestContext,
    budget: Budget,
    productVariantId: ID,
    customFields?: { [key: string]: any },
  ) {
    const existingBudgetLine = await this.getExistingBudgetLine(ctx, budget, productVariantId, customFields);
    if (existingBudgetLine) {
      return existingBudgetLine;
    }

    const productVariant = await this.getProductVariantOrThrow(ctx, productVariantId, budget);
    const featuredAssetId = productVariant.featuredAssetId ?? productVariant.product.featuredAssetId;
    const budgetLine = await this.connection.getRepository(ctx, BudgetLine).save(
      new BudgetLine({
        productVariant,
        taxCategory: productVariant.taxCategory,
        featuredAsset: featuredAssetId ? { id: featuredAssetId } : undefined,
        listPrice: productVariant.listPrice,
        listPriceIncludesTax: productVariant.listPriceIncludesTax,
        adjustments: [],
        taxLines: [],
        // customFields,
        quantity: 0,
      }),
    );
    const { orderSellerStrategy } = this.configService.orderOptions;
    if (typeof orderSellerStrategy.setOrderLineSellerChannel === 'function') {
      budgetLine.sellerChannel = await orderSellerStrategy.setOrderLineSellerChannel(ctx, budgetLine as any);
      await this.connection
        .getRepository(ctx, BudgetLine)
        .createQueryBuilder()
        .relation('sellerChannel')
        .of(budgetLine)
        .set(budgetLine.sellerChannel);
    }
    // await this.customFieldRelationService.updateRelations(ctx, BudgetLine, { customFields }, budgetLine);
    budget.lines.push(budgetLine);
    await this.connection
      .getRepository(ctx, Budget)
      .createQueryBuilder()
      .relation('lines')
      .of(budget)
      .add(budgetLine);
    return budgetLine;
  }

  /**
   * @description
   * Updates the quantity of an OrderLine, taking into account the available saleable stock level.
   * Returns the actual quantity that the OrderLine was updated to (which may be less than the
   * `quantity` argument if insufficient stock was available.
   */
  async updateBudgetLineQuantity(
    ctx: RequestContext,
    budgetLine: BudgetLine,
    quantity: number,
    budget: Budget,
  ): Promise<BudgetLine> {
    const currentQuantity = budgetLine.quantity;
    budgetLine.quantity = quantity;
    await this.connection.getRepository(ctx, BudgetLine).save(budgetLine);
    return budgetLine;
  }

  //   async setShippingMethods(ctx: RequestContext, budget: Budget, shippingMethodIds: ID[]) {
  //     for (const [i, shippingMethodId] of shippingMethodIds.entries()) {
  //       const shippingMethod = await this.shippingCalculator.getMethodIfEligible(ctx, budget, shippingMethodId);
  //       if (!shippingMethod) {
  //         return new IneligibleShippingMethodError();
  //       }
  //       let shippingLine: ShippingLine | undefined = (budget as any).shippingLines[i];
  //       if (shippingLine) {
  //         shippingLine.shippingMethod = shippingMethod;
  //         shippingLine.shippingMethodId = shippingMethod.id;
  //       } else {
  //         shippingLine = await this.connection.getRepository(ctx, ShippingLine).save(
  //           new ShippingLine({
  //             shippingMethod,
  //             order: budget as any,
  //             adjustments: [],
  //             listPrice: 0,
  //             listPriceIncludesTax: ctx.channel.pricesIncludeTax,
  //             taxLines: [],
  //           }),
  //         );
  //         if ((budget as any).shippingLines) {
  //           (budget as any).shippingLines.push(shippingLine);
  //         } else {
  //           (budget as any).shippingLines = [shippingLine];
  //         }
  //       }

  //       await this.connection.getRepository(ctx, ShippingLine).save(shippingLine);
  //     }
  //     // remove any now-unused ShippingLines
  //     if (shippingMethodIds.length < (budget as any).shippingLines.length) {
  //       const shippingLinesToDelete = (budget as any).shippingLines.splice(shippingMethodIds.length - 1);
  //       await this.connection.getRepository(ctx, ShippingLine).remove(shippingLinesToDelete);
  //     }
  //     // assign the ShippingLines to the OrderLines
  //     await this.connection
  //       .getRepository(ctx, BudgetLine)
  //       .createQueryBuilder('line')
  //       .update({ shippingLine: undefined })
  //       .whereInIds(budget.lines.map(l => l.id))
  //       .execute();
  //     const { shippingLineAssignmentStrategy } = this.configService.shippingOptions;
  //     for (const shippingLine of (budget as any).shippingLines) {
  //       const orderLinesForShippingLine = await shippingLineAssignmentStrategy.assignShippingLineToOrderLines(
  //         ctx,
  //         shippingLine,
  //         budget as any,
  //       );
  //       await this.connection
  //         .getRepository(ctx, BudgetLine)
  //         .createQueryBuilder('line')
  //         .update({ shippingLineId: shippingLine.id })
  //         .whereInIds(orderLinesForShippingLine.map(l => l.id))
  //         .execute();
  //       orderLinesForShippingLine.forEach(line => {
  //         line.shippingLine = shippingLine;
  //       });
  //     }
  //     return budget;
  //   }

  /**
   * This function is required because with the MySQL driver, boolean customFields with a default
   * of `false` were being represented as `0`, thus causing the equality check to fail.
   * So if it's a boolean, we'll explicitly coerce the value to a boolean.
   */
  private coerceValue(def: CustomFieldConfig, existingCustomFields: { [p: string]: any } | undefined) {
    const key = def.name;
    return def.type === 'boolean' && typeof existingCustomFields?.[key] === 'number'
      ? !!existingCustomFields?.[key]
      : existingCustomFields?.[key];
  }

  private async getProductVariantOrThrow(
    ctx: RequestContext,
    productVariantId: ID,
    budget: Budget,
  ): Promise<ProductVariant> {
    const variant = await this.connection.findOneInChannel(
      ctx,
      ProductVariant,
      productVariantId,
      ctx.channelId,
      {
        relations: ['product', 'productVariantPrices', 'taxCategory'],
        loadEagerRelations: false,
        where: { deletedAt: IsNull() },
      },
    );

    if (variant) {
      return await this.productVariantService.applyChannelPriceAndTax(variant, ctx, budget as any);
    } else {
      throw new EntityNotFoundError('ProductVariant', productVariantId);
    }
  }
}
