import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  MutationSetDraftOrderShippingAddressArgs,
  MutationUpdateShippingMethodArgs,
  Permission,
} from '@vendure/common/lib/generated-types';
import {
  Allow,
  Ctx,
  EntityHydrator,
  EventBus,
  ID,
  InternalServerError,
  Order,
  OrderService,
  RequestContext,
  ShippingMethod,
  ShippingMethodService,
  Transaction,
  TransactionalConnection,
} from '@vendure/core';
import {
  CUSTOM_SHIPPING_FULFILLMENT_CODE,
  CUSTOM_SHIPPING_METHOD_CODE,
  CUSTOM_SHIPPING_QUOTE_STATUS_NOT_REQUIRED,
  CUSTOM_SHIPPING_QUOTE_STATUS_PENDING,
  CUSTOM_SHIPPING_QUOTE_STATUS_READY,
} from '../constants';
import { findZoneForCountry } from '../destination';
import { CustomShippingQuoteReadyEvent } from '../events/event-types';

type CustomSetShippingQuoteInput = {
  orderId: ID;
  shippingAmountWithTax: number;
  notifyCustomer?: boolean;
};

type CustomShippingQuoteState = {
  orderId: ID;
  status: string;
  destination: string | null;
  shippingAmountWithTax: number | null;
  currencyCode: string;
};

@Resolver()
export class CustomShippingAdminResolver {
  constructor(
    private readonly shippingMethodService: ShippingMethodService,
    private readonly connection: TransactionalConnection,
    private readonly orderService: OrderService,
    private readonly eventBus: EventBus,
    private readonly entityHydrator: EntityHydrator,
  ) {}

  /**
   * Overrides the default `updateShippingMethod` mutation so that
   * any checker/calculator change is propagated to all other shipping methods
   * that share the same fulfillment handler (keeping them in sync).
   */
  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateSettings, Permission.UpdateShippingMethod)
  async updateShippingMethod(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationUpdateShippingMethodArgs,
  ): Promise<ShippingMethod> {
    const { input } = args;
    const updated = await this.shippingMethodService.update(ctx, input);

    const syncFields: (keyof MutationUpdateShippingMethodArgs['input'])[] = ['calculator', 'checker'];
    if (
      updated.fulfillmentHandlerCode === CUSTOM_SHIPPING_FULFILLMENT_CODE &&
      syncFields.some(f => input[f])
    ) {
      const { items: siblings } = await this.shippingMethodService.findAll(ctx, {
        filter: { fulfillmentHandlerCode: { eq: CUSTOM_SHIPPING_FULFILLMENT_CODE } },
      });

      await Promise.all(
        siblings
          .filter(m => m.id !== updated.id)
          .map(m =>
            this.shippingMethodService.update(ctx, {
              id: m.id,
              checker: input.checker,
              calculator: input.calculator,
              translations: m.translations,
            }),
          ),
      );
    }

    return updated;
  }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateOrder)
  async setDraftOrderShippingAddress(
    @Ctx() ctx: RequestContext,
    @Args() args: MutationSetDraftOrderShippingAddressArgs,
  ): Promise<Order> {
    const order = await this.orderService.setShippingAddress(ctx, args.orderId, args.input);
    await this.syncShippingQuoteFields(ctx, order);
    return order;
  }

  private async syncShippingQuoteFields(ctx: RequestContext, order: Order): Promise<void> {
    const zone = order.shippingAddress?.countryCode
      ? await findZoneForCountry(
          ctx,
          order.shippingAddress.countryCode,
          order.shippingAddress.postalCode,
          this.connection,
        )
      : null;

    await this.orderService.updateCustomFields(ctx, order.id, {
      customShippingDestination: zone?.name ?? null,
      customShippingQuoteStatus: zone?.customFields?.quoteEnabled
        ? CUSTOM_SHIPPING_QUOTE_STATUS_PENDING
        : CUSTOM_SHIPPING_QUOTE_STATUS_NOT_REQUIRED,
    });
  }

  /**
   * Returns the current shipping quote state for a given order.
   * Useful for admin UIs that need to show whether a quote is pending/ready.
   */
  @Transaction()
  @Query()
  @Allow(Permission.ReadOrder, Permission.UpdateOrder)
  async customShippingQuoteState(
    @Ctx() ctx: RequestContext,
    @Args('orderId') orderId: ID,
  ): Promise<CustomShippingQuoteState> {
    const order = await this.connection.getRepository(ctx, Order).findOne({
      where: { id: orderId },
    });
    if (!order) {
      throw new InternalServerError(`Order ${String(orderId)} not found`);
    }

    // const zone = order.shippingAddress?.countryCode
    //   ? await findZoneForCountry(
    //       ctx,
    //       order.shippingAddress.countryCode,
    //       order.shippingAddress.postalCode,
    //       this.connection,
    //     )
    //   : null;

    // if (!zone?.customFields?.quoteEnabled) {
    //   return {
    //     orderId: order.id,
    //     status: CUSTOM_SHIPPING_QUOTE_STATUS_NOT_REQUIRED,
    //     destination: zone?.name ?? null,
    //     shippingAmountWithTax: null,
    //     currencyCode: order.currencyCode,
    //   };
    // }

    const fields = order.customFields ?? {};
    return {
      orderId: order.id,
      status: String(fields.customShippingQuoteStatus ?? CUSTOM_SHIPPING_QUOTE_STATUS_PENDING),
      destination: fields.customShippingDestination ?? null,
      shippingAmountWithTax: Number.isFinite(Number(fields.customShippingQuoteAmount))
        ? Number(fields.customShippingQuoteAmount)
        : null,
      currencyCode: order.currencyCode,
    };
  }

  /**
   * Admin mutation: set the manual shipping quote for an out-of-Europe order.
   *
   * - Marks quote status as READY
   * - Stores the quote amount on the order
   * - Adds a public order note
   * - Optionally emails the customer so they can proceed to payment
   */
  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateOrder, Permission.ReadCustomer)
  async customSetShippingQuote(
    @Ctx() ctx: RequestContext,
    @Args('input') input: CustomSetShippingQuoteInput,
  ): Promise<Order> {
    const order = await this.connection.getRepository(ctx, Order).findOne({
      where: { id: input.orderId },
      relations: ['customer'],
    });
    if (!order) {
      throw new InternalServerError(`Order ${String(input.orderId)} not found`);
    }
    this.orderService.updateCustomFields(ctx, input.orderId, {
      customShippingQuoteStatus: CUSTOM_SHIPPING_QUOTE_STATUS_READY,
      customShippingQuoteAmount: input.shippingAmountWithTax,
      customShippingQuoteUpdatedAt: new Date(),
    });

    await this.orderService.addNoteToOrder(ctx, {
      id: input.orderId,
      isPublic: true,
      note: `Shipping quote set: ${(input.shippingAmountWithTax / 100).toFixed(2)} ${order.currencyCode}`,
    });

    if (input.notifyCustomer !== false && order.customer?.emailAddress) {
      this.eventBus.publish(
        new CustomShippingQuoteReadyEvent(
          ctx,
          order.customer.emailAddress,
          order.code,
          input.shippingAmountWithTax,
          order.currencyCode,
        ),
      );
    }

    return order;
  }
}
