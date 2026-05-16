import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
    ChannelService,
    EntityHydrator,
    EventBus,
    GlobalSettingsService,
    idsAreEqual,
    Logger,
    OrderService,
    OrderStateTransitionEvent,
    TransactionalConnection,
} from '@vendure/core';
import { LOYALTY_POINTS_PLUGIN_OPTIONS } from '../constants';
import { LoyaltyService } from '../services/loyalty.service';
import { PluginInitOptions } from '../types';
import { loggerCtx } from '../constants';

@Injectable()
export class LoyaltyOrderListener implements OnModuleInit {
    constructor(
        private eventBus: EventBus,
        private loyaltyService: LoyaltyService,
        private globalSettingsService: GlobalSettingsService,
        private entityHydrator: EntityHydrator,
        private orderService: OrderService,
        private channelService: ChannelService,
        private connection: TransactionalConnection,
        @Inject(LOYALTY_POINTS_PLUGIN_OPTIONS) private options: PluginInitOptions,
    ) {}

    onModuleInit() {
        this.eventBus.ofType(OrderStateTransitionEvent).subscribe({
            next: async event => {
                try {
                    const { ctx: outerCtx, order, toState } = event;
                    if (!order.customerId) {
                        return;
                    }

                    if (!order.aggregateOrderId) {
                        // not a sub/seller order
                        return;
                    }

                    if (toState !== 'PaymentSettled') {
                        // not settled payment
                        return;
                    }

                    await this.connection.withTransaction(outerCtx, async ctx => {
                        // 1. Check if order has loyalty coupon and redeem points for order
                        const loyaltyCoupon = order.couponCodes.some(c => c === this.options.couponCode);

                        if (loyaltyCoupon && order.discounts.length) {
                            // redeem points for order
                            await this.loyaltyService.redeemPointsForOrder(ctx, order.customerId!, order.id);
                            Logger.debug(
                                `Redeem points for order ${order.code} ${order.customerId}`,
                                loggerCtx,
                            );
                        }

                        const settings = await this.globalSettingsService.getSettings(ctx);
                        if (!settings) {
                            Logger.warn('No LoyaltyPointsSettings found, skipping loyalty award.', loggerCtx);
                            return;
                        }

                        // 2. Get seller channel and see if it supports loyalty discount
                        await this.entityHydrator.hydrate(ctx, order, {
                            relations: ['channels', 'channels.seller', 'lines'],
                        });

                        const defaultChannel = await this.channelService.getDefaultChannel();
                        const sellerChannel = order.channels.find(c => !idsAreEqual(c.id, defaultChannel.id));
                        if (!sellerChannel?.seller) {
                            return;
                        }

                        const cF = sellerChannel.seller.customFields;
                        if (!cF.enableLoyaltyDiscount) {
                            // seller does not enable loyalty discount
                            return;
                        }

                        //3. Reward points for order (say, 1 point X currencyValue)
                        const pointsPerEuro = settings.customFields.pointsPerEuro;
                        const eligibleAmount = order.lines.reduce((acc, line) => {
                            return acc + line.proratedLinePriceWithTax;
                        }, 0);

                        if (!eligibleAmount) {
                            Logger.warn(
                                `No eligible amount for order ${order.code} ${order.customerId}`,
                                loggerCtx,
                            );
                            return;
                        }

                        const points = Math.floor((eligibleAmount / 100) * pointsPerEuro);
                        if (!points) {
                            Logger.warn(
                                `No points to award for order ${order.code} ${order.customerId}`,
                                loggerCtx,
                            );
                            return;
                        }

                        // 4. Award points for order and add a note to the order
                        await this.loyaltyService.awardPointsForOrder(ctx, order, points);
                        await this.orderService.addNoteToOrder(ctx, {
                            id: order.id,
                            isPublic: true,
                            note:
                                'Awarded ' +
                                points +
                                ' loyalty points to customer ' +
                                order.customerId +
                                ' for order ' +
                                order.code,
                        });
                    });
                } catch (err) {
                    Logger.error('LoyaltyOrderListener failed: ' + err, loggerCtx);
                }
            },
            error: err => {
                Logger.error('LoyaltyOrderListener subscription failed: ' + err, loggerCtx);
            },
        });
    }
}
