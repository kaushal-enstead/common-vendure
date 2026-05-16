import { LanguageCode } from '@vendure/common/lib/generated-types';
import { Injector, PromotionCondition } from '@vendure/core';
import { PromotionExtensionService } from '../../services/promotion-extension.service';

let promotionExtService: PromotionExtensionService;

export const minimumOrderAmount = new PromotionCondition({
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'If order total is greater than { amount }',
        },
        {
            languageCode: LanguageCode.pt,
            value: 'Se o total do pedido for maior que { amount }',
        },
        {
            languageCode: LanguageCode.pt_PT,
            value: 'Se o total do pedido for maior que { amount }',
        },
    ],
    init(injector: Injector) {
        promotionExtService = injector.get(PromotionExtensionService);
    },
    code: 'CUSTOM-minimum_order_amount',
    args: {
        amount: {
            type: 'int',
            defaultValue: 100,
            ui: { component: 'currency-form-input' },
        },
        taxInclusive: { type: 'boolean', defaultValue: false },
    },
    check: async (ctx, order, args, promotion) => {
        if (!order.customerId) {
            throw new Error('Order not eligible for promotion');
            return false;
        }
        const orderLines = await promotionExtService.eligibleOrderLines(ctx, promotion.couponCode, order);
        if (!orderLines.length) {
            throw new Error('Order not eligible for promotion');
            return false;
        }

        const amount = orderLines.reduce((acc, line) => {
            const price = args.taxInclusive ? line.unitPriceWithTax : line.unitPrice;
            return acc + price * line.quantity;
        }, 0);

        return amount >= args.amount;
    },
    priorityValue: 10,
});
