import { Injectable } from '@nestjs/common';
import { Channel, Order, OrderLine, Promotion, RequestContext, TransactionalConnection } from '@vendure/core';
import { ChannelService } from '@vendure/core';
import { Logger } from '@vendure/core';
import { IsNull } from 'typeorm';

@Injectable()
export class PromotionExtensionService {
    constructor(
        private connection: TransactionalConnection,
        private channelService: ChannelService,
    ) {}

    async eligibleOrderLines(
        ctx: RequestContext,
        couponCode: string,
        order: Order,
    ): Promise<(OrderLine & { channel: Channel })[]> {
        const promotion = await this.connection.getRepository(ctx, Promotion).findOne({
            where: { couponCode, deletedAt: IsNull() },
            relations: ['channels'],
        });
        Logger.verbose(`promotion: ${promotion?.couponCode}`);

        if (!promotion) {
            return [];
        }

        const promotionChannelId = promotion.channels.find(c => c.code !== '__default_channel__')?.id;
        Logger.verbose(`promotionChannelId: ${promotionChannelId}`);
        if (!promotionChannelId) {
            return [];
        }
        const channel = await this.channelService.findOne(ctx, promotionChannelId);
        Logger.verbose(`channel: ${channel?.id} ${channel?.code}`);

        if (!channel) {
            return [];
        }
        const orderLines = order.lines.filter(line => channel.id === line.sellerChannelId);
        if (!orderLines.length) {
            return [];
        }
        Logger.verbose(`orderLines: ${orderLines.length}`);
        const res = orderLines.map(l => ({ ...l, channel }) as OrderLine & { channel: Channel });
        Logger.info(`res: ${res.length}`);
        return res;
    }
}
