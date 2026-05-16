import { LanguageCode } from '@vendure/common/lib/generated-types';
import { ID } from '@vendure/common/lib/shared-types';
import { idsAreEqual, OrderLine, PromotionCondition, CouponCodeInvalidError } from '@vendure/core';

export const containsProducts = new PromotionCondition({
    code: 'CUSTOM-contains_products',
    description: [
        { languageCode: LanguageCode.en, value: 'Buy at least { minimum } of the specified products' },
        {
            languageCode: LanguageCode.pt,
            value: 'Comprar pelo menos { minimum } dos produtos especificados',
        },
        {
            languageCode: LanguageCode.pt_PT,
            value: 'Comprar pelo menos { minimum } dos produtos especificados',
        },
    ],
    args: {
        minimum: {
            type: 'int',
            defaultValue: 1,
            label: [
                { languageCode: LanguageCode.en, value: 'Minimum' },
                { languageCode: LanguageCode.pt, value: 'Mínimo' },
                { languageCode: LanguageCode.pt_PT, value: 'Mínimo' },
            ],
        },
        productVariantIds: {
            type: 'ID',
            list: true,
            ui: { component: 'product-selector-form-input' },
            label: [
                { languageCode: LanguageCode.en, value: 'Product variants' },
                { languageCode: LanguageCode.pt, value: 'Variantes de produto' },
                { languageCode: LanguageCode.pt_PT, value: 'Variantes de produto' },
            ],
        },
    },
    async check(ctx, order, args) {
        const ids = args.productVariantIds;
        let matches = 0;
        for (const line of order.lines) {
            if (lineContainsIds(ids, line)) {
                matches += line.quantity;
            }
        }

        const result = args.minimum <= matches;
        if (!result) {
            throw new Error('Order not eligible for promotion');
        }
        return result;
    },
});

function lineContainsIds(ids: ID[], line: OrderLine): boolean {
    return !!ids.find(id => idsAreEqual(id, line.productVariant.id));
}
