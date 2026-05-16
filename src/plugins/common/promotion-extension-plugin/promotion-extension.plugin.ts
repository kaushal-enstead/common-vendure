import { Asset, LanguageCode, PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { PromotionResolver } from './api/promotion-extension.resolver';
import { shopApiExtensions } from './api/api-extensions';
import { PROMOTION_EXTENSION_PLUGIN_OPTIONS } from './constants';
import { PluginInitOptions } from './types';
import {
    buyXGetYFreeAction,
    discountByFixAmount,
    discountByPercentage,
    productsPercentageDiscount,
    freeGiftAction,
    // freeShipping,
} from './promotion/actions';
import {
    minimumOrderAmount,
    atLeastOneEligibleOrderLine,
    containsProducts,
    buyXGetYFreeCondition,
} from './promotion/conditions';
import { PromotionExtensionService } from './services/promotion-extension.service';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [
        {
            provide: PROMOTION_EXTENSION_PLUGIN_OPTIONS,
            useFactory: () => PromotionExtensionPlugin.options,
        },
        PromotionExtensionService,
    ],
    compatibility: '^3.0.0',
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [PromotionResolver],
    },
    configuration: config => {
        config.customFields.Promotion.push({
            name: 'assets',
            type: 'relation',
            list: true,
            entity: Asset,
            ui: { component: 'asset-picker-form-input' },
            label: [
                { languageCode: LanguageCode.en, value: 'Assets' },
                { languageCode: LanguageCode.pt, value: 'Ativos' },
                { languageCode: LanguageCode.pt_PT, value: 'Ativos' },
            ],
        });
        config.promotionOptions.promotionActions = [];
        config.promotionOptions.promotionConditions = [];
        config.promotionOptions.promotionActions.push(
            discountByFixAmount,
            discountByPercentage,
            // freeShipping,
            productsPercentageDiscount,
            freeGiftAction,
            buyXGetYFreeAction,
        );
        config.promotionOptions.promotionConditions.push(
            minimumOrderAmount,
            atLeastOneEligibleOrderLine,
            containsProducts,
            buyXGetYFreeCondition,
        );
        config.customFields.OrderLine.push(
            {
                name: 'freeGiftPromotionId',
                type: 'string',
                public: true,
                readonly: true,
                nullable: true,
            },
            {
                name: 'freeGiftDescription',
                type: 'string',
                public: true,
                readonly: true,
                nullable: true,
            },
        );
        return config;
    },
})
export class PromotionExtensionPlugin {
    static options: PluginInitOptions;

    static init(options: PluginInitOptions): Type<PromotionExtensionPlugin> {
        this.options = options;
        return PromotionExtensionPlugin;
    }
}
