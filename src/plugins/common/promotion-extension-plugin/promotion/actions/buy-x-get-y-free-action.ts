import { LanguageCode } from '@vendure/common/lib/generated-types';
import { buyXGetYFreeCondition } from '../conditions/buy-x-get-y-free-condition';
import { PromotionItemAction } from '@vendure/core';

export const buyXGetYFreeAction = new PromotionItemAction({
    code: 'CUSTOM-buy_x_get_y_free',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'Buy X products, get Y products free',
        },
        {
            languageCode: LanguageCode.pt,
            value: 'Compre X produtos, receba Y produtos grátis',
        },
        {
            languageCode: LanguageCode.pt_PT,
            value: 'Compre X produtos, receba Y produtos grátis',
        },
    ],
    args: {},
    conditions: [buyXGetYFreeCondition],
    execute(ctx, orderLine, args, state) {
        const freeItemsPerLine = state['CUSTOM-buy_x_get_y_free'].freeItemsPerLine;
        const freeQuantity = freeItemsPerLine[orderLine.id];
        if (freeQuantity) {
            const unitPrice = ctx.channel.pricesIncludeTax ? orderLine.unitPriceWithTax : orderLine.unitPrice;
            return -unitPrice * (freeQuantity / orderLine.quantity);
        }
        return 0;
    },
});
