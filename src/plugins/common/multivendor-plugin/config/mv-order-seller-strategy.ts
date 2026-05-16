import {
  ChannelService,
  EntityHydrator,
  EventBus,
  GlobalSettingsService,
  ID,
  idsAreEqual,
  Injector,
  InternalServerError,
  isGraphQlErrorResult,
  Logger,
  Order,
  OrderLine,
  OrderSellerStrategy,
  OrderService,
  PaymentMethod,
  PaymentMethodService,
  PaymentService,
  RequestContext,
  SplitOrderContents,
  Surcharge,
  TransactionalConnection,
} from '@vendure/core';

import { CONNECTED_PAYMENT_METHOD_CODE, MULTIVENDOR_PLUGIN_OPTIONS } from '../constants';
import { MultivendorPluginOptions } from '../types';
import { OrderSplitEvent } from '../events/order-split';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
  interface CustomSellerFields {
    connectedAccountId: string;
  }
}

export class MultivendorSellerStrategy implements OrderSellerStrategy {
  private entityHydrator: EntityHydrator;
  private channelService: ChannelService;
  private paymentService: PaymentService;
  private paymentMethodService: PaymentMethodService;
  private connection: TransactionalConnection;
  private orderService: OrderService;
  private options: MultivendorPluginOptions;
  private globalSettingsService: GlobalSettingsService;
  private eventBus: EventBus;

  init(injector: Injector) {
    this.entityHydrator = injector.get(EntityHydrator);
    this.channelService = injector.get(ChannelService);
    this.paymentService = injector.get(PaymentService);
    this.paymentMethodService = injector.get(PaymentMethodService);
    this.connection = injector.get(TransactionalConnection);
    this.orderService = injector.get(OrderService);
    this.options = injector.get(MULTIVENDOR_PLUGIN_OPTIONS);
    this.globalSettingsService = injector.get(GlobalSettingsService);
    this.eventBus = injector.get(EventBus);
  }

  async setOrderLineSellerChannel(ctx: RequestContext, orderLine: OrderLine) {
    await this.entityHydrator.hydrate(ctx, orderLine.productVariant, { relations: ['channels'] });
    const defaultChannel = await this.channelService.getDefaultChannel();

    // If a ProductVariant is assigned to exactly 2 Channels, then one is the default Channel
    // and the other is the seller's Channel.
    if (orderLine.productVariant.channels.length === 2) {
      const sellerChannel = orderLine.productVariant.channels.find(
        c => !idsAreEqual(c.id, defaultChannel.id),
      );
      if (sellerChannel) {
        return sellerChannel;
      }
    }
  }

  async splitOrder(ctx: RequestContext, order: Order): Promise<SplitOrderContents[]> {
    const partialOrders = new Map<ID, SplitOrderContents>();
    for (const line of order.lines) {
      const sellerChannelId = line.sellerChannelId;
      if (sellerChannelId) {
        let partialOrder = partialOrders.get(sellerChannelId);
        if (!partialOrder) {
          partialOrder = {
            channelId: sellerChannelId,
            shippingLines: [],
            lines: [],
            state: 'ArrangingPayment',
          };
          partialOrders.set(sellerChannelId, partialOrder);
        }
        partialOrder.lines.push(line);
      }
    }

    for (const partialOrder of partialOrders.values()) {
      const shippingLineIds = new Set(partialOrder.lines.map(l => l.shippingLineId));
      partialOrder.shippingLines = order.shippingLines.filter(shippingLine =>
        shippingLineIds.has(shippingLine.id),
      );
    }

    return [...partialOrders.values()];
  }

  async afterSellerOrdersCreated(ctx: RequestContext, aggregateOrder: Order, sellerOrders: Order[]) {
    this.eventBus.publish(new OrderSplitEvent(ctx, aggregateOrder, sellerOrders));

    // We need to know if the father has EasyPay
    await this.entityHydrator.hydrate(ctx, aggregateOrder, { relations: ['payments'] as any });
    const parentHasEasypay = aggregateOrder.payments?.some(p => p.method === 'easypay') ?? false;

    // Keeps surcharges and adjustments (this has nothing to do with the payment method)
    const defaultChannel = await this.channelService.getDefaultChannel();

    // If the parent has EasyPay → we DO NOT create payment here in sub-orders.
    // The webhook will insert/align the "easypay" payment in the sub-orders with the same transactionId.
    if (parentHasEasypay) {
      for (const sellerOrder of sellerOrders) {
        const sellerChannel = sellerOrder.channels.find(c => !idsAreEqual(c.id, defaultChannel.id));
        if (!sellerChannel) {
          throw new InternalServerError(`Could not determine Seller Channel for Order ${sellerOrder.code}`);
        }

        // keeps the platform fee in the sub-order
        sellerOrder.surcharges = [await this.createPlatformFeeSurcharge(ctx, sellerOrder)];
        await this.orderService.applyPriceAdjustments(ctx, sellerOrder);
      }
      return;
    }

    // If the parent does NOT have EasyPay, keeps the old behavior (connected-payment-method)
    const paymentMethod = await this.connection.rawConnection.getRepository(PaymentMethod).findOne({
      where: { code: CONNECTED_PAYMENT_METHOD_CODE },
    });
    if (!paymentMethod) {
      // Without a configured method, there is nothing to create (and we do not fail)
      return;
    }

    for (const sellerOrder of sellerOrders) {
      const sellerChannel = sellerOrder.channels.find(c => !idsAreEqual(c.id, defaultChannel.id));
      if (!sellerChannel) {
        throw new InternalServerError(`Could not determine Seller Channel for Order ${sellerOrder.code}`);
      }

      sellerOrder.surcharges = [await this.createPlatformFeeSurcharge(ctx, sellerOrder)];
      await this.orderService.applyPriceAdjustments(ctx, sellerOrder);
      await this.entityHydrator.hydrate(ctx, sellerChannel, { relations: ['seller'] });

      const result = await this.orderService.addPaymentToOrder(ctx, sellerOrder.id, {
        method: paymentMethod.code,
        metadata: {
          transfer_group: aggregateOrder.code,
          connectedAccountId: sellerChannel.seller?.customFields.connectedAccountId,
        },
      });
      if (isGraphQlErrorResult(result)) {
        throw new InternalServerError(result.message);
      }
    }
  }

  private async createPlatformFeeSurcharge(ctx: RequestContext, sellerOrder: Order) {
    // const defaultChannel = await this.channelService.getDefaultChannel();
    const settings = await this.globalSettingsService.getSettings(ctx);

    const feePercentage = (settings?.customFields as any)?.percentageFee ?? this.options.platformFeePercent;
    const platformFee = Math.round(sellerOrder.totalWithTax * -(feePercentage / 100));
    return this.connection.getRepository(ctx, Surcharge).save(
      new Surcharge({
        taxLines: [],
        sku: this.options.platformFeeSKU,
        description: 'Platform fee',
        listPrice: platformFee,
        listPriceIncludesTax: true,
        order: sellerOrder,
      }),
    );
  }
}
