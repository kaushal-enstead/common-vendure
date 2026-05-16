import { LanguageCode, Logger, PromotionItemAction } from '@vendure/core';
import { atLeastOneEligibleOrderLine } from '../conditions/at_least_one_eligible_order_line';

export const discountByPercentage = new PromotionItemAction({
    code: 'CUSTOM-discount-by-percentage',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'Discount orderLine by { discount }%',
        },
        { languageCode: LanguageCode.pt, value: 'Desconto na linha do pedido de { discount }%' },
        { languageCode: LanguageCode.pt_PT, value: 'Desconto na linha do pedido de { discount }%' },
    ],
    args: {
        discount: {
            type: 'int',
            label: [
                { languageCode: LanguageCode.en, value: 'Discount' },
                { languageCode: LanguageCode.pt, value: 'Desconto' },
                { languageCode: LanguageCode.pt_PT, value: 'Desconto' },
            ],
            ui: {
                component: 'number-form-input',
                suffix: '%',
            },
        },
        maxDiscount: {
            type: 'int',
            required: false,
            label: [
                { languageCode: LanguageCode.en, value: 'Max Discount' },
                { languageCode: LanguageCode.pt, value: 'Desconto máximo' },
                { languageCode: LanguageCode.pt_PT, value: 'Desconto máximo' },
            ],
            ui: {
                component: 'number-form-input',
                suffix: '%',
            },
        },
    },
    conditions: [atLeastOneEligibleOrderLine],
    execute: async (ctx, orderLine, args, state) => {
        const { orderLines } = state['CUSTOM-at_least_one_eligible_order_line'];
        // check if this orderLine is in the orderLines array that satisfies the condition/promotion
        const line = orderLines.find(l => l.id === orderLine.id);
        if (!line) {
            return 0;
        }

        const unitPrice = line.channel.pricesIncludeTax ? line.unitPriceWithTax : line.unitPrice;
        let discount = (unitPrice * args.discount) / 100;
        if (args.maxDiscount) {
            discount = Math.min(discount, args.maxDiscount);
        }
        return -discount;
    },
    // onDeactivate: async (ctx, order, arg, promotion) => {
    //     const _ctx = RequestContext.empty();

    //     const affectedOrderLines = order.lines.map(line => ({
    //         ...line,
    //         adjustments: line.adjustments.filter(a => a.adjustmentSource !== `PROMOTION:${promotion.id}`),
    //     }));
    //     if (affectedOrderLines.length > 0) {
    //         await connection.getRepository(_ctx, OrderLine).save(affectedOrderLines);
    //     }
    // },
});
