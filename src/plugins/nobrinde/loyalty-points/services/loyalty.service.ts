import { Inject, Injectable } from '@nestjs/common';
import { ID } from '@vendure/common/lib/shared-types';
import {
  assertFound,
  Channel,
  ChannelService,
  Customer,
  CustomerService,
  EventBus,
  GlobalSettingsService,
  LanguageCode,
  Order,
  OrderService,
  patchEntity,
  Promotion,
  RelationPaths,
  RequestContext,
  Seller,
  TransactionalConnection,
  TranslatableSaver,
} from '@vendure/core';
import { PromotionTranslation } from '@vendure/core/dist/entity/promotion/promotion-translation.entity';
import { LOYALTY_POINTS_PLUGIN_OPTIONS, redeemActionCode, conditionCode } from '../constants';
import { LoyaltyWalletHistory, LoyaltyWalletHistoryType } from '../entities/loyalty-wallet-history.entity';
import { PluginInitOptions } from '../types';
import { LoyaltyPointSettings, LoyaltySettingsInput } from '../gql/generated';
import { LoyaltyPointsEarnEvent } from '../events/event-types';
import { In } from 'typeorm';
import { LoyaltyPointsRedeemEvent } from '../events/event-types';
import { LoyaltySettings } from '../entities/loyalty-settings';

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

  async findOne(
    ctx: RequestContext,
    relations?: RelationPaths<LoyaltySettings>,
  ): Promise<LoyaltySettings | null> {
    return this.connection.getRepository(ctx, LoyaltySettings).findOne({
      where: { channel: { id: ctx.channelId } },
      relations,
    });

    // const channel = await this.connection.getRepository(ctx, Channel).findOne({
    //   where: { id: ctx.channelId },
    //   relations: ['seller'],
    // });
    // if (!channel?.seller) {
    //   return null;
    // }

    // const seller = channel.seller;
    // const cF = seller.customFields;

    // return {
    //   id: seller.id,
    //   createdAt: seller.createdAt,
    //   updatedAt: seller.updatedAt,
    //   channel,
    //   pointsPerEuro: cF.pointsPerEuro || 0,
    //   maxRedeemablePoints: cF.maxRedeemablePoints || 0,
    //   enableLoyaltyDiscount: cF.enableLoyaltyDiscount || false,
    //   loyaltyDiscount: cF.loyaltyDiscount || 0,
    //   channelId: ctx.channelId as string,
    // };
  }

  async getSettingsByChannelId(ctx: RequestContext, channelId: string): Promise<LoyaltySettings | null> {
    return this.connection.getRepository(ctx, LoyaltySettings).findOne({
      where: { channel: { id: channelId } },
    });
  }

  async create(ctx: RequestContext, input: LoyaltySettingsInput): Promise<LoyaltySettings> {
    const settings = new LoyaltySettings({
      pointsPerEuro: input.pointsPerEuro || 0,
      maxRedeemablePoints: input.maxRedeemablePoints || 0,
      enableLoyaltyDiscount: input.enableLoyaltyDiscount || false,
      loyaltyDiscount: input.loyaltyDiscount || 0,
      channelId: ctx.channelId as string,
    });

    await this.connection.getRepository(ctx, LoyaltySettings).save(settings);
    return assertFound(this.findOne(ctx));
  }

  async update(ctx: RequestContext, input: LoyaltySettingsInput): Promise<LoyaltySettings> {
    const entity = await this.findOne(ctx);
    if (!entity) {
      // create new settings
      return this.create(ctx, input);
    }

    // update existing settings
    const updatedEntity = patchEntity(entity, input);
    await this.connection.getRepository(ctx, LoyaltySettings).save(updatedEntity, { reload: false });
    return assertFound(this.findOne(ctx));
  }

  async getSellersEligibleForLoyaltyDiscount(
    ctx: RequestContext,
    order: Order,
    checkLoyaltyDiscount: boolean = false,
  ): Promise<Record<string, Seller & { channel: Channel; loyaltySetting: LoyaltySettings }>> {
    const sellerChannelIDs = order.lines.map(l => l.sellerChannelId);
    if (!sellerChannelIDs.length) {
      return {};
    }
    const sellers = await this.connection.getRepository(ctx, Seller).find({
      where: { channels: { id: In(sellerChannelIDs) } },
      relations: ['channels'],
    });
    const loyaltySettings = await this.connection.getRepository(ctx, LoyaltySettings).find({
      where: { channel: { id: In(sellerChannelIDs) } },
    });

    if (!sellers.length) {
      return {};
    }
    const filteredSellers = sellers.filter(({ channels }) => {
      const channelId = channels.find(c => c.code !== '__default_channel__')?.id;
      if (!channelId) {
        return false;
      }
      const loyaltySetting = loyaltySettings.find(s => s.channelId === channelId);
      if (!loyaltySetting?.enableLoyaltyDiscount) {
        return false;
      }
      return checkLoyaltyDiscount ? loyaltySetting.loyaltyDiscount : true;
    });
    if (!filteredSellers.length) {
      return {};
    }

    const sellerByChannelId: Record<string, Seller & { channel: Channel; loyaltySetting: LoyaltySettings }> =
      {};
    for (const seller of filteredSellers) {
      const channel = seller.channels.find(c => c.code !== '__default_channel__');
      if (channel) {
        const loyaltySetting = loyaltySettings.find(s => s.channelId === channel.id);
        if (!loyaltySetting) {
          continue;
        }
        sellerByChannelId[channel.id] = { ...seller, channel, loyaltySetting };
      }
    }

    return sellerByChannelId;
  }

  async getLoyaltyPointSettings(ctx: RequestContext): Promise<LoyaltyPointSettings> {
    const settings = await this.findOne(ctx);
    if (!settings) {
      throw new Error('Loyalty settings not found');
    }
    const customer = await this.customerService.findOneByUserId(ctx, ctx.activeUserId as ID);
    if (!customer) {
      throw new Error('Customer not found');
    }
    const availablePoints = customer.customFields.points - customer.customFields.freezePoints || 0;
    // check if customer has enough points to redeem
    let hasAvailablePoints = availablePoints > 0 && availablePoints >= (settings.maxRedeemablePoints || 0);
    // check if order has at least one seller that offers loyalty discount
    if (hasAvailablePoints) {
      const order = await this.orderService.getActiveOrderForUser(ctx, ctx.activeUserId as ID);
      const eligibleSellers = order ? await this.getSellersEligibleForLoyaltyDiscount(ctx, order, true) : {};
      hasAvailablePoints = Object.keys(eligibleSellers).length > 0;
    }

    return {
      pointsPerEuro: settings.pointsPerEuro,
      maxRedeemablePoints: settings.maxRedeemablePoints,
      couponCode: this.options.couponCode,
      isEligible: hasAvailablePoints,
    };
  }

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
        new LoyaltyPointsEarnEvent(ctx, customer.emailAddress, points, balanceAfter, order.id.toString()),
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
        new LoyaltyPointsRedeemEvent(ctx, customer.emailAddress, points, balanceAfter, orderId.toString()),
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
    const settings = await this.findOne(ctx);
    if (!settings) {
      throw new Error('Loyalty settings not found');
    }
    const pointsToRedeem = settings.maxRedeemablePoints;
    const pointsPerEuro = settings.pointsPerEuro;
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
              code: redeemActionCode,
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
