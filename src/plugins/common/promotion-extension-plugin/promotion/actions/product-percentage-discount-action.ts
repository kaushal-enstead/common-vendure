import { LanguageCode } from '@vendure/common/lib/generated-types';
import { ID } from '@vendure/common/lib/shared-types';
import { idsAreEqual, OrderLine, PromotionItemAction } from '@vendure/core';

export const productsPercentageDiscount = new PromotionItemAction({
    code: 'CUSTOM-products_percentage_discount',
    description: [
        { languageCode: LanguageCode.en, value: 'Discount specified products by { discount }%' },
        { languageCode: LanguageCode.pt, value: 'Desconto para produtos específicos { discount } %' },
        { languageCode: LanguageCode.pt_PT, value: 'Desconto para produtos específicos { discount } %' },
    ],
    args: {
        discount: {
            type: 'float',
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
    execute(ctx, orderLine, args) {
        if (lineContainsIds(args.productVariantIds, orderLine)) {
            const unitPrice = ctx.channel.pricesIncludeTax ? orderLine.unitPriceWithTax : orderLine.unitPrice;
            return -unitPrice * (args.discount / 100);
        }
        return 0;
    },
});

function lineContainsIds(ids: ID[], line: OrderLine): boolean {
    return !!ids.find(id => idsAreEqual(id, line.productVariant.id));
}
