import { LanguageCode } from '@vendure/common/lib/generated-types';
import { Injector, Logger, PromotionCondition } from '@vendure/core';
import { PromotionExtensionService } from '../../services/promotion-extension.service';

let promotionExtService: PromotionExtensionService;

export const atLeastOneEligibleOrderLine = new PromotionCondition({
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'If order has at least one order line that satisfies the promotion',
        },
        {
            languageCode: LanguageCode.pt,
            value: 'Se o pedido tem pelo menos uma linha de pedido que satisfaz a promoção',
        },
        {
            languageCode: LanguageCode.pt_PT,
            value: 'Se o pedido tem pelo menos uma linha de pedido que satisfaz a promoção',
        },
    ],
    init(injector: Injector) {
        promotionExtService = injector.get(PromotionExtensionService);
    },
    code: 'CUSTOM-at_least_one_eligible_order_line',
    args: {},
    check: async (ctx, order, args, promotion) => {
        if (!order.customerId) {
            return false;
        }

        const orderLines = await promotionExtService.eligibleOrderLines(ctx, promotion.couponCode, order);
        if (!orderLines?.length) {
            throw new Error('Order not eligible for promotion');
            return false;
        }

        Logger.verbose(`orderLines: ${orderLines.length}`, 'atLeastOneEligibleOrderLine');
        return { customerId: order.customerId, orderLines, couponCode: promotion.couponCode };
    },
});
