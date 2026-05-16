import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CreateAddressInput } from '@vendure/common/lib/generated-types';
import {
  Ctx,
  InternalServerError,
  Order,
  OrderService,
  RequestContext,
  Transaction,
  TransactionalConnection,
} from '@vendure/core';
import {
  CUSTOM_SHIPPING_QUOTE_STATUS_NOT_REQUIRED,
  CUSTOM_SHIPPING_QUOTE_STATUS_PENDING,
} from '../constants';
import { findZoneForCountry } from '../destination';

@Resolver()
export class CustomShippingShopResolver {
  constructor(
    private readonly orderService: OrderService,
    private readonly connection: TransactionalConnection,
  ) {}

  @Transaction()
  @Mutation()
  async setOrderShippingAddress(
    @Ctx() ctx: RequestContext,
    @Args('input') input: CreateAddressInput,
  ): Promise<Order> {
    const orderId = ctx.session?.activeOrderId;
    if (!orderId) throw new InternalServerError('No active order');

    const order = await this.orderService.setShippingAddress(ctx, orderId, input);
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
}
