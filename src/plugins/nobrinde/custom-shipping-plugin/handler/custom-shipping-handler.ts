import { FulfillmentHandler, LanguageCode } from '@vendure/core';
import { CUSTOM_SHIPPING_FULFILLMENT_CODE } from '../constants';

export const customShippingFulfillmentHandler = new FulfillmentHandler({
    code: CUSTOM_SHIPPING_FULFILLMENT_CODE,
    description: [
        { languageCode: LanguageCode.en, value: 'Custom Shipping Delivery' },
        { languageCode: LanguageCode.pt, value: 'Entrega de Envio Personalizado' },
    ],

    args: {
        trackingCode: {
            type: 'string',
            required: false,
            label: [
                { languageCode: LanguageCode.en, value: 'Tracking code' },
                { languageCode: LanguageCode.pt, value: 'Código de rastreio' },
            ],
        },
    },

    createFulfillment: async (_ctx, _orders, _lines, args) => ({
        method: CUSTOM_SHIPPING_FULFILLMENT_CODE,
        trackingCode: args.trackingCode ? String(args.trackingCode) : undefined,
        customFields: {},
    }),

    onFulfillmentTransition: async () => {
        return;
    },
});
