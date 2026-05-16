import { LanguageCode, PromotionShippingAction } from '@vendure/core';
import { atLeastOneEligibleOrderLine } from '../conditions/at_least_one_eligible_order_line';

export const freeShipping = new PromotionShippingAction({
    code: 'CUSTOM-free-shipping-for-channel-products',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'Free shipping for products from current channel',
        },
        { languageCode: LanguageCode.pt, value: 'Frete grátis para produtos do canal atual' },
        { languageCode: LanguageCode.pt_PT, value: 'Frete grátis para produtos do canal atual' },
    ],

    args: {},
    conditions: [atLeastOneEligibleOrderLine],
    execute: async (ctx, shippingLine, order, args, state) => {
        const { orderLines } = state['CUSTOM-at_least_one_eligible_order_line'];
        if (!shippingLine.shippingMethodId) {
            return 0;
        }

        const foundLine = orderLines.find(l => l.shippingLineId === shippingLine.id);
        if (!foundLine) {
            return 0;
        }

        return foundLine.channel.pricesIncludeTax ? -shippingLine.priceWithTax : -shippingLine.price;
    },
});
