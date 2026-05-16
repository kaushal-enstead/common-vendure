import { Inject, Injectable } from '@nestjs/common';
import { ID } from '@vendure/common/lib/shared-types';
import {
    Channel,
    ChannelService,
    Customer,
    CustomerService,
    EventBus,
    GlobalSettingsService,
    LanguageCode,
    Order,
    OrderService,
    Promotion,
    RequestContext,
    Seller,
    TransactionalConnection,
    TranslatableSaver,
} from '@vendure/core';
import { PromotionTranslation } from '@vendure/core/dist/entity/promotion/promotion-translation.entity';
import { LOYALTY_POINTS_PLUGIN_OPTIONS, actionCode, conditionCode } from '../constants';
import { LoyaltyWalletHistory, LoyaltyWalletHistoryType } from '../entities/loyalty-wallet-history.entity';
import { PluginInitOptions } from '../types';
import { LoyaltyPointsSettings } from '../gql/generated';
import { LoyaltyPointsEarnEvent } from '../events/event-types';
import { In } from 'typeorm';
import { LoyaltyPointsRedeemEvent } from '../events/event-types';
@Injectable()
export class LoyaltyService {
    constructor(
        private connection: TransactionalConnection,
        private orderService: OrderService,
        private eventBus: EventBus,
        private globalSettingsService: GlobalSettingsService,
        private translatableSaver: TranslatableSaver,
        private channelService: ChannelService,
        private customerService: CustomerService,
        @Inject(LOYALTY_POINTS_PLUGIN_OPTIONS) private options: PluginInitOptions,
    ) {}

    async getSellersEligibleForLoyaltyDiscount(
        ctx: RequestContext,
        order: Order,
        checkLoyaltyDiscount: boolean = false,
    ): Promise<Record<string, Seller & { channel: Channel }>> {
        const sellerChannelIDs = order.lines.map(l => l.sellerChannelId);
        if (!sellerChannelIDs.length) {
            return {};
        }
        const sellers = await this.connection.getRepository(ctx, Seller).find({
            where: { channels: { id: In(sellerChannelIDs) } },
            relations: ['channels'],
        });

        if (!sellers.length) {
            return {};
        }
        const filteredSellers = sellers.filter(
            ({ customFields: c }) =>
                c.enableLoyaltyDiscount && (checkLoyaltyDiscount ? c.loyaltyDiscount : true),
        );
        if (!filteredSellers.length) {
            return {};
        }

        const sellerByChannelId: Record<string, Seller & { channel: Channel }> = {};
        for (const seller of filteredSellers) {
            const channel = seller.channels.find(c => c.code !== '__default_channel__');
            if (channel) {
                sellerByChannelId[channel.id] = { ...seller, channel };
            }
        }

        return sellerByChannelId;
    }

    async getLoyaltySettings(ctx: RequestContext): Promise<LoyaltyPointsSettings> {
        const settings = await this.globalSettingsService.getSettings(ctx);
        const customer = await this.customerService.findOneByUserId(ctx, ctx.activeUserId as ID);
        if (!customer) {
            throw new Error('Customer not found');
        }
        const availablePoints = customer.customFields.points - customer.customFields.freezePoints || 0;
        // check if customer has enough points to redeem
        let hasAvailablePoints =
            availablePoints > 0 && availablePoints >= (settings.customFields.maxRedeemablePoints || 0);
        // check if order has at least one seller that offers loyalty discount
        if (hasAvailablePoints) {
            const order = await this.orderService.getActiveOrderForUser(ctx, ctx.activeUserId as ID);
            const eligibleSellers = order
                ? await this.getSellersEligibleForLoyaltyDiscount(ctx, order, true)
                : {};
            hasAvailablePoints = Object.keys(eligibleSellers).length > 0;
        }

        return {
            pointsPerEuro: settings.customFields.pointsPerEuro,
            maxRedeemablePoints: settings.customFields.maxRedeemablePoints,
            couponCode: this.options.couponCode,
            isEligible: hasAvailablePoints,
        };
    }

    // async getPromotionSettings(
    //     outerCtx: RequestContext,
    // ): Promise<{ pointsPerEuro: number; maxPoints: number }> {
    //     const promotion = await this.connection.getRepository(outerCtx, Promotion).findOne({
    //         where: { couponCode: LoyaltyCouponCode },
    //     });

    //     if (!promotion || !promotion.actions?.length) {
    //         throw new Error('Promotion not found');
    //     }

    //     const action = promotion.actions.find(a => a.code === actionCode);
    //     if (!action || !Array.isArray(action.args)) {
    //         throw new Error('Redeem action not found');
    //     }

    //     return {
    //         pointsPerEuro: Number(action.args.find(a => a.name === 'pointsPerEuro')?.value) || 0,
    //         maxPoints: Number(action.args.find(a => a.name === 'maxPoints')?.value) || 0,
    //     };
    // }

    async awardPointsForOrder(outerCtx: RequestContext, order: Order, points: number): Promise<void> {
        await this.connection.withTransaction(outerCtx, async ctx => {
            if (!order.customer) return;
            const customer = await this.customerService.findOne(ctx, order.customer.id);
            if (!customer) {
                throw new Error('Customer not found');
            }
            const prevBalance = customer.customFields.points;
            const balanceAfter = prevBalance + points;

            const loyaltyWalletHistory = await this.connection.getRepository(ctx, LoyaltyWalletHistory).save({
                customerId: customer.id,
                points,
                balanceAfter,
                prevBalance,
                orderId: order.id,
                source: 'order',
                type: LoyaltyWalletHistoryType.EARN,
            });

            const history = Array.isArray(customer.customFields.history) ? customer.customFields.history : [];
            history.push(loyaltyWalletHistory);
            customer.customFields.points = balanceAfter;
            customer.customFields.history = history;
            await this.connection.getRepository(ctx, Customer).save(customer, { reload: false });

            this.eventBus.publish(
                new LoyaltyPointsEarnEvent(
                    ctx,
                    customer.emailAddress,
                    points,
                    balanceAfter,
                    order.id.toString(),
                ),
            );
        });
    }

    async redeemPointsForOrder(outerCtx: RequestContext, customerId: ID, orderId: ID): Promise<void> {
        await this.connection.withTransaction(outerCtx, async ctx => {
            const customer = await this.customerService.findOne(ctx, customerId);
            if (!customer) {
                throw new Error('Customer not found');
            }
            const { pointsToRedeem } = await this.getPointsToRedeem(ctx);
            const prevBalance = customer.customFields.points;
            const points = pointsToRedeem;
            if (prevBalance < points) throw new Error('Not enough loyalty points');

            const balanceAfter = prevBalance - points;

            // await this.orderService.addSurchargeToOrder(ctx, orderId, {
            //     description: 'Loyalty Discount',
            //     // loyaltyPointspointsPerEuro means "how much currency equals 1 point"
            //     // So, to get the currency value for N points, multiply points by the conversion rate, and negate for a discount
            //     listPrice: redeemPoints * settings.customFields.loyaltyPointspointsPerEuro * -1,
            // });
            const loyaltyWalletHistory = await this.connection.getRepository(ctx, LoyaltyWalletHistory).save({
                customerId,
                points,
                balanceAfter,
                prevBalance,
                orderId,
                source: 'order',
                type: LoyaltyWalletHistoryType.REDEEM,
            });
            const history = Array.isArray(customer.customFields.history) ? customer.customFields.history : [];
            history.push(loyaltyWalletHistory);
            customer.customFields.freezePoints = 0;
            customer.customFields.points = balanceAfter;
            customer.customFields.history = history;
            await this.connection.getRepository(ctx, Customer).save(customer, { reload: false });
            this.eventBus.publish(
                new LoyaltyPointsRedeemEvent(
                    ctx,
                    customer.emailAddress,
                    points,
                    balanceAfter,
                    orderId.toString(),
                ),
            );
        });
    }

    async getWalletOrThrow(
        ctx: RequestContext,
        customerId: ID,
    ): Promise<{ points: number; freezePoints: number; availablePoints: number }> {
        const customer = await this.customerService.findOne(ctx, customerId);
        if (!customer) {
            throw new Error('Customer not found');
        }
        const availablePoints = customer.customFields.points - customer.customFields.freezePoints || 0;
        return {
            points: customer.customFields.points || 0,
            freezePoints: customer.customFields.freezePoints || 0,
            availablePoints,
        };
    }

    async getPointsToRedeem(ctx: RequestContext): Promise<{ pointsToRedeem: number; pointsPerEuro: number }> {
        const settings = await this.globalSettingsService.getSettings(ctx);
        const pointsToRedeem = settings.customFields.maxRedeemablePoints;
        const pointsPerEuro = settings.customFields.pointsPerEuro;
        return { pointsToRedeem, pointsPerEuro };
    }

    async freezePoints(ctx: RequestContext, customerId: ID, availablePoints?: number): Promise<void> {
        await this.connection.withTransaction(ctx, async ctx => {
            const { pointsToRedeem } = await this.getPointsToRedeem(ctx);
            if (!availablePoints) {
                availablePoints = (await this.getWalletOrThrow(ctx, customerId)).availablePoints;
            }
            if (pointsToRedeem > availablePoints) {
                throw new Error('Not enough points');
            }
            if (pointsToRedeem > 0) {
                await this.customerService.update(ctx, {
                    id: customerId,
                    customFields: { freezePoints: pointsToRedeem },
                });
            }
        });
    }

    async unfreezePoints(ctx: RequestContext, customerId: ID, freezePoints?: number): Promise<void> {
        await this.connection.withTransaction(ctx, async ctx => {
            if (!freezePoints) {
                freezePoints = (await this.getWalletOrThrow(ctx, customerId)).freezePoints;
            }
            if (freezePoints > 0) {
                await this.customerService.update(ctx, {
                    id: customerId,
                    customFields: { freezePoints: 0 },
                });
            }
        });
    }

    async ensurePromotionExist() {
        const ctx = RequestContext.empty();
        const defaultChannel = await this.channelService.getDefaultChannel();
        const promotion = await this.connection.getRepository(ctx, Promotion).findOne({
            where: { couponCode: this.options.couponCode },
        });
        if (!promotion) {
            const input = new Promotion({
                name: 'Loyalty Points Promotion',
                enabled: true,
                couponCode: this.options.couponCode,
                startsAt: new Date(),
                endsAt: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
                channels: [defaultChannel],
                priorityScore: 1,
                translations: [
                    {
                        languageCode: LanguageCode.en,
                        name: 'Loyalty Points Promotion',
                        description: 'Loyalty Points Promotion',
                    },
                ],
            });
            await this.translatableSaver.create({
                ctx,
                input,
                entityType: Promotion,
                translationType: PromotionTranslation,
                beforeSave: async p => {
                    p.priorityScore = 1;
                    p.conditions = [
                        {
                            code: conditionCode,
                            args: [
                                // { name: 'pointsPerEuro', value: '1000' },
                                // { name: 'maxPoints', value: '100' },
                            ],
                        },
                    ];
                    p.actions = [
                        {
                            code: actionCode,
                            args: [
                                // { name: 'pointsPerEuro', value: '1000' },
                                // { name: 'maxPoints', value: '100' },
                            ],
                        },
                    ];
                    await this.channelService.assignToCurrentChannel(p, ctx);
                },
            });
        }
    }
}
