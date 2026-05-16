import {
  CurrencyCode,
  Discount,
  OrderAddress,
  OrderTaxSummary,
  OrderType,
  TaxLine,
} from '@vendure/common/lib/generated-types';
import { DeepPartial, ID } from '@vendure/common/lib/shared-types';
import { summate } from '@vendure/common/lib/shared-utils';
import {
  Calculated,
  Channel,
  ChannelAware,
  Customer,
  EntityId,
  InternalServerError,
  Money,
  Promotion,
  VendureEntity,
} from '@vendure/core';
import { Column, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { BudgetLine } from './budget-line';

export enum BudgetState {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  ChangesRequested = 'ChangesRequested',
}

export enum BudgetType {
  Admin = 'Admin',
  Customer = 'Customer',
}

/**
 * @description
 * An Order is created whenever a {@link Customer} adds an item to the cart. It contains all the
 * information required to fulfill an order: which {@link ProductVariant}s in what quantities;
 * the shipping address and price; any applicable promotions; payments etc.
 *
 * An Order exists in a well-defined state according to the {@link BudgetState} type. A state machine
 * is used to govern the transition from one state to another.
 *
 * @docsCategory entities
 */
@Entity()
export class Budget extends VendureEntity implements ChannelAware {
  constructor(input?: DeepPartial<Budget>) {
    super(input);
  }

  @Column('varchar', { default: BudgetType.Admin })
  type: BudgetType;

  @OneToMany(type => Budget, sellerOrder => sellerOrder.aggregateOrder)
  sellerOrders: Budget[];

  @Index()
  @ManyToOne(type => Budget, aggregateOrder => aggregateOrder.sellerOrders)
  aggregateOrder?: Budget;

  @EntityId({ nullable: true })
  aggregateOrderId?: ID;

  /**
   * @description
   * A unique code for the Order, generated according to the
   * {@link OrderCodeStrategy}. This should be used as an order reference
   * for Customers, rather than the Order's id.
   */
  @Column()
  @Index({ unique: true })
  code: string;

  @Column('varchar') state: BudgetState;

  /**
   * @description
   * Whether the Order is considered "active", meaning that the
   * Customer can still make changes to it and has not yet completed
   * the checkout process.
   * This is governed by the {@link OrderPlacedStrategy}.
   */
  @Column({ default: true })
  active: boolean;

  /**
   * @description
   * The date & time that the Order was placed, i.e. the Customer
   * completed the checkout and the Order is no longer "active".
   * This is governed by the {@link OrderPlacedStrategy}.
   */
  @Column({ nullable: true })
  @Index()
  orderPlacedAt?: Date;

  @Index()
  @ManyToOne(type => Customer, customer => customer.orders)
  customer?: Customer;

  @EntityId({ nullable: true })
  customerId?: ID;

  @OneToMany(type => BudgetLine, line => line.budget)
  lines: BudgetLine[];

  /**
   * @description
   * Surcharges are arbitrary modifications to the Order total which are neither
   * ProductVariants nor discounts resulting from applied Promotions. For example,
   * one-off discounts based on customer interaction, or surcharges based on payment
   * methods.
   */
  // @OneToMany(type => Surcharge, surcharge => surcharge.order)
  // surcharges: Surcharge[];

  /**
   * @description
   * An array of all coupon codes applied to the Order.
   */
  @Column('simple-array')
  couponCodes: string[];

  /**
   * @description
   * An array of all coupon codes applied to the Order.
   */
  @Column('json', { nullable: true })
  messages: Array<{
    id: string;
    content: string;
    sender: string;
    senderId: string;
    timestamp: Date;
    budgetId: string;
  }>;
  /**
   * @description
   * Promotions applied to the order. Only gets populated after the payment process has completed,
   * i.e. the Order is no longer active.
   */
  @ManyToMany(type => Promotion)
  @JoinTable()
  promotions: Promotion[];

  @Column('simple-json') shippingAddress: OrderAddress;

  @Column('simple-json') billingAddress: OrderAddress;

  // @OneToMany(type => Payment, payment => payment.order)
  // payments: Payment[];

  // @ManyToMany(type => Fulfillment, fulfillment => fulfillment.orders)
  // @JoinTable()
  // fulfillments: Fulfillment[];

  @Column('varchar')
  currencyCode: CurrencyCode;

  //   @Column(type => CustomOrderFields)
  //   customFields: CustomOrderFields;

  @EntityId({ nullable: true })
  taxZoneId?: ID;

  @ManyToMany(type => Channel)
  @JoinTable()
  channels: Channel[];

  //   @OneToMany(type => OrderModification, modification => modification.order)
  //   modifications: OrderModification[];

  /**
   * @description
   * The subTotal is the total of all OrderLines in the Order. This figure also includes any Order-level
   * discounts which have been prorated (proportionally distributed) amongst the OrderItems.
   * To get a total of all OrderLines which does not account for prorated discounts, use the
   * sum of {@link OrderLine}'s `discountedLinePrice` values.
   */
  @Money()
  subTotal: number;

  /**
   * @description
   * Same as subTotal, but inclusive of tax.
   */
  @Money()
  subTotalWithTax: number;

  /**
   * @description
   * The shipping charges applied to this order.
   */
  // @OneToMany(type => ShippingLine, shippingLine => shippingLine.order)
  // shippingLines: ShippingLine[];

  /**
   * @description
   * The total of all the `shippingLines`.
   */
  @Money({ default: 0 })
  shipping: number;

  @Money({ default: 0 })
  shippingWithTax: number;

  @Calculated({ relations: ['lines'] })
  get discounts(): Discount[] {
    this.throwIfLinesNotJoined('discounts');
    const groupedAdjustments = new Map<string, Discount>();
    for (const line of this.lines ?? []) {
      for (const discount of line.discounts) {
        const adjustment = groupedAdjustments.get(discount.adjustmentSource);
        if (adjustment) {
          adjustment.amount += discount.amount;
          adjustment.amountWithTax += discount.amountWithTax;
        } else {
          groupedAdjustments.set(discount.adjustmentSource, { ...discount });
        }
      }
    }
    // for (const shippingLine of this.shippingLines ?? []) {
    //   for (const discount of shippingLine.discounts) {
    //     const adjustment = groupedAdjustments.get(discount.adjustmentSource);
    //     if (adjustment) {
    //       adjustment.amount += discount.amount;
    //       adjustment.amountWithTax += discount.amountWithTax;
    //     } else {
    //       groupedAdjustments.set(discount.adjustmentSource, { ...discount });
    //     }
    //   }
    // }
    return [...groupedAdjustments.values()];
  }

  /**
   * @description
   * Equal to `subTotal` plus `shipping`
   */
  //   @Calculated({
  //     query: qb =>
  //       qb
  //         .leftJoin(
  //           qb1 => {
  //             return qb1
  //               .from(Order, 'order')
  //               .select('order.shipping + order.subTotal', 'total')
  //               .addSelect('order.id', 'oid');
  //           },
  //           't1',
  //           't1.oid = order.id',
  //         )
  //         .addSelect('t1.total', 'total'),
  //     expression: 'total',
  //   })
  get total(): number {
    return this.subTotal + (this.shipping || 0);
  }

  /**
   * @description
   * The final payable amount. Equal to `subTotalWithTax` plus `shippingWithTax`.
   */
  //   @Calculated({
  //     query: qb =>
  //       qb
  //         .leftJoin(
  //           qb1 => {
  //             return qb1
  //               .from(Order, 'order')
  //               .select('order.shippingWithTax + order.subTotalWithTax', 'twt')
  //               .addSelect('order.id', 'oid');
  //           },
  //           't1',
  //           't1.oid = order.id',
  //         )
  //         .addSelect('t1.twt', 'twt'),
  //     expression: 'twt',
  //   })
  get totalWithTax(): number {
    return this.subTotalWithTax + (this.shippingWithTax || 0);
  }

  @Calculated({
    relations: ['lines'],
    query: qb => {
      qb.leftJoin(
        qb1 => {
          return qb1
            .from(Budget, 'budget')
            .select('SUM(lines.quantity)', 'qty')
            .addSelect('budget.id', 'oid')
            .leftJoin('budget.lines', 'lines')
            .groupBy('budget.id');
        },
        't1',
        't1.oid = budget.id',
      ).addSelect('t1.qty', 'qty');
    },
    expression: 'qty',
  })
  get totalQuantity(): number {
    this.throwIfLinesNotJoined('totalQuantity');
    return summate(this.lines, 'quantity');
  }

  /**
   * @description
   * A summary of the taxes being applied to this Order.
   */
  @Calculated({ relations: ['lines'] })
  get taxSummary(): OrderTaxSummary[] {
    this.throwIfLinesNotJoined('taxSummary');
    // this.throwIfSurchargesNotJoined('taxSummary');
    const taxRateMap = new Map<string, { rate: number; base: number; tax: number; description: string }>();
    const taxId = (taxLine: TaxLine): string => `${taxLine.description}:${taxLine.taxRate}`;
    const taxableLines = [...(this.lines ?? [])];
    for (const line of taxableLines) {
      const taxRateTotal = summate(line.taxLines, 'taxRate');
      for (const taxLine of line.taxLines) {
        const id = taxId(taxLine);
        const row = taxRateMap.get(id);
        const proportionOfTotalRate = 0 < taxLine.taxRate ? taxLine.taxRate / taxRateTotal : 0;

        const lineBase = line instanceof BudgetLine ? line.proratedLinePrice : 0;
        const lineWithTax = line instanceof BudgetLine ? line.proratedLinePriceWithTax : 0;
        const amount = Math.round((lineWithTax - lineBase) * proportionOfTotalRate);
        if (row) {
          row.tax += amount;
          row.base += lineBase;
        } else {
          taxRateMap.set(id, {
            tax: amount,
            base: lineBase,
            description: taxLine.description,
            rate: taxLine.taxRate,
          });
        }
      }
    }
    return Array.from(taxRateMap.entries()).map(([taxRate, row]) => ({
      taxRate: row.rate,
      description: row.description,
      taxBase: row.base,
      taxTotal: row.tax,
    }));
  }

  private throwIfLinesNotJoined(propertyName: keyof Budget) {
    if (this.lines == null) {
      const errorMessage = [
        `The property "${propertyName}" on the Budget entity requires the Budget.lines relation to be joined.`,
        "This can be done with the EntityHydratorService: `await entityHydratorService.hydrate(ctx, order, { relations: ['lines'] })`",
      ];

      throw new InternalServerError(errorMessage.join('\n'));
    }
  }
  // private throwIfSurchargesNotJoined(propertyName: keyof Budget) {
  //   if (this.surcharges == null) {
  //     const errorMessage = [
  //       `The property "${propertyName}" on the Budget entity requires the Budget.surcharges relation to be joined.`,
  //       "This can be done with the EntityHydratorService: `await entityHydratorService.hydrate(ctx, order, { relations: ['surcharges'] })`",
  //     ];

  //     throw new InternalServerError(errorMessage.join('\n'));
  //   }
  // }
}
