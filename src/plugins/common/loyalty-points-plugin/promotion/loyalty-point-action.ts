import {
    Injector,
    LanguageCode,
    PromotionItemAction,
    TransactionalConnection,
    OrderLine,
} from '@vendure/core';
import { minimumOneAdheredSeller } from './minimum-one-adhered-seller';
import { actionCode } from '../constants';

let connection: TransactionalConnection;
export const redeemLoyaltyPointsAction = new PromotionItemAction({
    code: actionCode,
    description: [
        { languageCode: LanguageCode.en, value: 'Redeem loyalty points for discount' },
        { languageCode: LanguageCode.pt, value: 'Resgatar pontos de fidelidade para desconto' },
        { languageCode: LanguageCode.pt_PT, value: 'Resgatar pontos de fidelidade para desconto' },
    ],
    init(injector: Injector) {
        connection = injector.get(TransactionalConnection);
    },
    conditions: [minimumOneAdheredSeller],
    args: {},
    execute: async (ctx, orderLine, args, state) => {
        if (!orderLine.sellerChannelId) {
            return 0;
        }
        const { sellersChannels } = state['CUSTOM-minimum_one_adhered_seller'];
        const seller = sellersChannels[orderLine.sellerChannelId];
        const loyaltyDiscount = seller?.customFields?.loyaltyDiscount;

        if (!seller || !loyaltyDiscount) {
            return 0;
        }
        const unitPrice = seller.channel.pricesIncludeTax ? orderLine.unitPriceWithTax : orderLine.unitPrice;
        const discount = (unitPrice * loyaltyDiscount) / 100;
        return -Math.min(discount, unitPrice); // Avoid over-discount
    },
    // onActivate: async (ctx, order, args, a) => {
    //     if (!order.customer) return;

    //     const pointsData = order.customer.customFields;
    //     const availablePoints = pointsData.points - pointsData.freezePoints || 0;
    //     await loyaltyService.freezePoints(ctx, order.customer.id, availablePoints);
    // },
    onDeactivate: async (ctx, order, arg, promotion) => {
        // TODO:: Check if this is needed to remove order line adjustments
        if (!order.customer) return;
        // await loyaltyService.unfreezePoints(ctx, order.customer.id, order.customer.customFields.freezePoints);
        const affectedOrderLines = order.lines.map(line => ({
            ...line,
            adjustments: line.adjustments.filter(a => a.adjustmentSource !== `PROMOTION:${promotion.id}`),
        }));
        if (affectedOrderLines.length > 0) {
            await connection.getRepository(ctx, OrderLine).save(affectedOrderLines);
        }
    },
});
