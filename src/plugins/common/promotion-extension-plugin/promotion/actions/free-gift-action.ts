import {
    ID,
    idsAreEqual,
    isGraphQlErrorResult,
    LanguageCode,
    Logger,
    OrderLine,
    OrderService,
    PromotionItemAction,
} from '@vendure/core';

/**
 * Ref:- https://docs.vendure.io/guides/core-concepts/promotions/#free-gift-promotions
 */

let orderService: OrderService;
export const freeGiftAction = new PromotionItemAction({
    code: 'CUSTOM-free_gift',
    description: [
        { languageCode: LanguageCode.en, value: 'Add free gifts to the order' },
        { languageCode: LanguageCode.pt, value: 'Adicionar presentes grátis ao pedido' },
        { languageCode: LanguageCode.pt_PT, value: 'Adicionar presentes grátis ao pedido' },
    ],
    args: {
        productVariantIds: {
            type: 'ID',
            list: true,
            ui: { component: 'product-selector-form-input' },
            label: [
                { languageCode: LanguageCode.en, value: 'Gift product variants' },
                { languageCode: LanguageCode.pt, value: 'Variantes de produto presente' },
                { languageCode: LanguageCode.pt_PT, value: 'Variantes de produto presente' },
            ],
        },
    },
    init(injector) {
        orderService = injector.get(OrderService);
    },
    execute(ctx, orderLine, args) {
        // This part is responsible for ensuring the variants marked as
        // "free gifts" have their price reduced to zero
        if (lineContainsIds(args.productVariantIds, orderLine)) {
            const unitPrice = orderLine.productVariant.listPriceIncludesTax
                ? orderLine.unitPriceWithTax
                : orderLine.unitPrice;
            return -unitPrice;
        }
        return 0;
    },
    // The onActivate function is part of the side effect API, and
    // allows us to perform some action whenever a Promotion becomes active
    // due to it's conditions & constraints being satisfied.
    async onActivate(ctx, order, args, promotion) {
        for (const id of args.productVariantIds) {
            if (
                !order.lines.find(
                    line =>
                        idsAreEqual(line.productVariant.id, id) &&
                        line.customFields.freeGiftPromotionId == null,
                )
            ) {
                // The order does not yet contain this free gift, so add it
                const result = await orderService.addItemToOrder(ctx, order.id, id, 1, {
                    freeGiftPromotionId: promotion.id.toString(),
                });
                if (isGraphQlErrorResult(result)) {
                    Logger.error(`Free gift action error for variantId "${id}": ${result.message}`);
                }
            }
        }
    },
    // The onDeactivate function is the other part of the side effect API and is called
    // when an active Promotion becomes no longer active. It should reverse any
    // side effect performed by the onActivate function.
    async onDeactivate(ctx, order, args, promotion) {
        const linesWithFreeGift = order.lines.filter(
            line => line.customFields.freeGiftPromotionId === promotion.id.toString(),
        );
        for (const line of linesWithFreeGift) {
            await orderService.removeItemFromOrder(ctx, order.id, line.id);
        }
    },
});

function lineContainsIds(ids: ID[], line: OrderLine): boolean {
    return !!ids.find(id => idsAreEqual(id, line.productVariant.id));
}
