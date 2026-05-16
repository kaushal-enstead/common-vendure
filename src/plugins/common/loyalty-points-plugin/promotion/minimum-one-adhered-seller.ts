import { LanguageCode } from '@vendure/common/lib/generated-types';
import { Injector, PromotionCondition } from '@vendure/core';
import { LoyaltyService } from '../services/loyalty.service';
import { conditionCode } from '../constants';
/**
 * Issue : -https://github.com/vendure-ecommerce/vendure/issues/1012
 */
let loyaltyService: LoyaltyService;

export const minimumOneAdheredSeller = new PromotionCondition({
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'If order has at least one product from a seller that adheres to the loyalty program',
        },
        {
            languageCode: LanguageCode.pt,
            value: 'Se o pedido tem pelo menos um produto de um vendedor que adheres ao programa de fidelidade',
        },
        {
            languageCode: LanguageCode.pt_PT,
            value: 'Se o pedido tem pelo menos um produto de um vendedor que adheres ao programa de fidelidade',
        },  
    ],
    init(injector: Injector) {
        loyaltyService = injector.get(LoyaltyService);
    },
    code: conditionCode,
    args: {
        // pointsPerEuro: {
        //     type: 'int',
        //     label: [
        //         { languageCode: LanguageCode.en, value: 'Value per 10 points (in cents)' },
        //         { languageCode: LanguageCode.pt, value: 'Valor por 10 pontos (em centavos)' },
        //         { languageCode: LanguageCode.pt_PT, value: 'Valor por 10 pontos (em centavos)' },
        //     ],
        //     ui: {
        //         component: 'currency-form-input',
        //     },
        // },
        // pointsToRedeem: {
        //     type: 'int',
        //     description: [
        //         {
        //             languageCode: LanguageCode.en,
        //             value: 'Minimum and maximum points required to redeem this coupon',
        //         },
        //         {
        //             languageCode: LanguageCode.pt,
        //             value: 'Pontos mínimos e máximos necessários para resgatar este cupom',
        //         },
        //         {
        //             languageCode: LanguageCode.pt_PT,
        //             value: 'Pontos mínimos e máximos necessários para resgatar este cupom',
        //         },
        //     ],
        //     label: [
        //         { languageCode: LanguageCode.en, value: 'Points to redeem' },
        //         { languageCode: LanguageCode.pt, value: 'Pontos a canjear' },
        //         { languageCode: LanguageCode.pt_PT, value: 'Pontos a canjear' },
        //     ],
        //     ui: {
        //         component: 'number-form-input',
        //     },
        // },
    },
    /**
     * 1. Check if customer is attached
     * 2. Check if order has at least one seller
     * 3. Check if customer has enough points, should be greater than pointsToRedeem
     * 4. Check if any one of the seller adheres to loyalty program
     */
    check: async (ctx, order, args) => {
        if (!order.customerId) {
            return false;
        }

        const sellersChannels = await loyaltyService.getSellersEligibleForLoyaltyDiscount(ctx, order, true);
        if (!Object.keys(sellersChannels).length) {
            return false;
        }

        return { customerId: order.customerId, sellersChannels };
    },
    priorityValue: 10,
});
