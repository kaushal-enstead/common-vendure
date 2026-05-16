import { LanguageCode, Logger, PromotionItemAction } from '@vendure/core';
import { atLeastOneEligibleOrderLine } from '../conditions/at_least_one_eligible_order_line';

export const discountByFixAmount = new PromotionItemAction({
    code: 'CUSTOM-discount-by-fix-amount',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'Discount orderLine by fixed amount',
        },
        { languageCode: LanguageCode.pt, value: 'Desconto na linha do pedido por valor fixo' },
        { languageCode: LanguageCode.pt_PT, value: 'Desconto na linha do pedido por valor fixo' },
    ],
    args: {
        discount: {
            type: 'int',
            label: [
                { languageCode: LanguageCode.en, value: 'Discount' },
                { languageCode: LanguageCode.pt, value: 'Desconto' },
                { languageCode: LanguageCode.pt_PT, value: 'Desconto' },
            ],
            ui: { component: 'currency-form-input' },
        },
    },
    conditions: [atLeastOneEligibleOrderLine],
    execute: async (ctx, orderLine, args, state) => {
        const { orderLines } = state['CUSTOM-at_least_one_eligible_order_line'];
        Logger.verbose(`orderLines: ${orderLines.length}`, 'discountByFixAmount');
        // check if this orderLine is in the orderLines array that satisfies the condition/promotion
        const line = orderLines.find(l => l.id === orderLine.id);
        if (!line) {
            return 0;
        }
        const upperBound = line.channel.pricesIncludeTax ? line.unitPriceWithTax : line.unitPrice;
        Logger.verbose(`upperBound: ${upperBound}`, 'discountByFixAmount');
        return -Math.min(args.discount, upperBound);
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
