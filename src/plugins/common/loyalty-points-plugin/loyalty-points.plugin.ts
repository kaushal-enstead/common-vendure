import { LanguageCode, PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { LOYALTY_POINTS_PLUGIN_OPTIONS } from './constants';
import { LoyaltyService } from './services/loyalty.service';
import { PluginInitOptions } from './types';
import { redeemLoyaltyPointsAction } from './promotion/loyalty-point-action';
import { LoyaltyOrderListener } from './listener/loyalty-order.listener';
import { LoyaltyWalletHistory } from './entities/loyalty-wallet-history.entity';
import { minimumOneAdheredSeller } from './promotion/minimum-one-adhered-seller';
import { shopApiExtensions, adminApiExtensions } from './api/api-extensions';
import { LoyaltyPointsShopResolver } from './api/shop-resolver';
import { CouponCodeListener } from './listener/coupon-code.listener';
import { loyaltyPointsEarnHandler } from './events/event-handler';
import { loyaltyPointsRedeemHandler } from './events/event-handler';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [
        { provide: LOYALTY_POINTS_PLUGIN_OPTIONS, useFactory: () => LoyaltyPointsPlugin.options },
        LoyaltyService,
        LoyaltyOrderListener,
        CouponCodeListener,
    ],
    configuration: config => {
        config.promotionOptions.promotionActions.push(redeemLoyaltyPointsAction);
        config.promotionOptions.promotionConditions.push(minimumOneAdheredSeller);
        config.customFields.GlobalSettings.push(
            {
                name: 'pointsPerEuro',
                type: 'float',
                label: [
                    { languageCode: LanguageCode.en, value: 'Currency to Point Conversion' },
                    { languageCode: LanguageCode.pt, value: 'Conversão de Moeda para Pontos' },
                    { languageCode: LanguageCode.pt_PT, value: 'Conversão de Moeda para Pontos' },
                ],
                description: [
                    { languageCode: LanguageCode.en, value: 'How many points per euro' },
                    { languageCode: LanguageCode.pt, value: 'Quantos pontos equivalem a 1 euro' },
                    { languageCode: LanguageCode.pt_PT, value: 'Quantos pontos equivalem a 1 euro' },
                ],
                ui: {
                    tab: 'Loyalty Settings',
                    component: 'number-form-input',
                    prefix: 'points',
                },
                defaultValue: 100,
            },
            {
                name: 'maxRedeemablePoints',
                type: 'int',
                label: [
                    { languageCode: LanguageCode.en, value: 'Max Points Redeemable at Once' },
                    { languageCode: LanguageCode.pt, value: 'Máximo de Pontos Resgatáveis por Vez' },
                    { languageCode: LanguageCode.pt_PT, value: 'Máximo de Pontos Resgatáveis por Vez' },
                ],
                description: [
                    {
                        languageCode: LanguageCode.en,
                        value: 'Maximum number of points that can be redeemed in a single transaction',
                    },
                    {
                        languageCode: LanguageCode.pt,
                        value: 'Máximo número de pontos que podem ser resgatados em uma única transação',
                    },
                    {
                        languageCode: LanguageCode.pt_PT,
                        value: 'Máximo número de pontos que podem ser resgatados em uma única transação',
                    },
                ],
                ui: {
                    tab: 'Loyalty Settings',
                    component: 'number-form-input',
                    prefix: 'points',
                },
                defaultValue: 0,
            },
        );
        config.customFields.Customer.push(
            {
                name: 'points',
                type: 'int',
                defaultValue: 0,
                readonly: true,
                label: [
                    { languageCode: LanguageCode.en, value: 'Points' },
                    { languageCode: LanguageCode.pt, value: 'Pontos' },
                    { languageCode: LanguageCode.pt_PT, value: 'Pontos' },
                ],
                ui: {
                    tab: 'Loyalty wallet',
                    component: 'number-form-input',
                    prefix: 'points',
                },
            },
            {
                name: 'freezePoints',
                type: 'int',
                defaultValue: 0,
                readonly: true,
                label: [
                    { languageCode: LanguageCode.en, value: 'Freeze Points' },
                    { languageCode: LanguageCode.pt, value: 'Pontos congelados' },
                    { languageCode: LanguageCode.pt_PT, value: 'Pontos congelados' },
                ],
                ui: {
                    tab: 'Loyalty wallet',
                    component: 'number-form-input',
                    prefix: 'points',
                },
            },
            {
                name: 'history',
                type: 'relation',
                readonly: true,
                public: false,
                list: true,
                label: [
                    { languageCode: LanguageCode.en, value: 'History' },
                    { languageCode: LanguageCode.pt, value: 'Histórico' },
                    { languageCode: LanguageCode.pt_PT, value: 'Histórico' },
                ],
                entity: LoyaltyWalletHistory,
                ui: { tab: 'Loyalty wallet' },
            },
        );
        config.customFields.Seller.push(
            {
                name: 'enableLoyaltyDiscount',
                type: 'boolean',
                label: [
                    { languageCode: LanguageCode.en, value: 'Adhere To Loyalty Program' },
                    { languageCode: LanguageCode.pt, value: 'Aderir ao Programa de Fidelização' },
                    { languageCode: LanguageCode.pt_PT, value: 'Aderir ao Programa de Fidelização' },
                ],
                ui: { tab: 'Loyalty Settings' },
            },
            {
                name: 'loyaltyDiscount',
                type: 'int',
                defaultValue: 0,
                description: [
                    {
                        languageCode: LanguageCode.en,
                        value: 'This discount % will be applied per item when the customer redeems the minimum required loyalty points.',
                    },
                    {
                        languageCode: LanguageCode.pt,
                        value: 'Este desconto % será aplicado por item quando o cliente resgatar o mínimo de pontos de fidelização necessários.',
                    },
                    {
                        languageCode: LanguageCode.pt_PT,
                        value: 'Este desconto % será aplicado por item quando o cliente resgatar o mínimo de pontos de fidelização necessários.',
                    },
                ],
                label: [
                    { languageCode: LanguageCode.en, value: 'Loyalty Discount %' },
                    { languageCode: LanguageCode.pt, value: 'Desconto de Fidelização %' },
                    { languageCode: LanguageCode.pt_PT, value: 'Desconto de Fidelização %' },
                ],
                ui: {
                    tab: 'Loyalty Settings',
                    component: 'number-form-input',
                    prefix: '%',
                },
            },
        );
        return config;
    },
    compatibility: '^3.0.0',
    entities: [LoyaltyWalletHistory],
    shopApiExtensions: { schema: shopApiExtensions, resolvers: [LoyaltyPointsShopResolver] },
    adminApiExtensions: { schema: adminApiExtensions, resolvers: [] },
})
export class LoyaltyPointsPlugin {
    static options: PluginInitOptions;
    constructor(private readonly loyaltyService: LoyaltyService) {}

    async onModuleInit() {
        await this.loyaltyService.ensurePromotionExist();
    }

    static init(options: PluginInitOptions): Type<LoyaltyPointsPlugin> {
        this.options = options;
        return LoyaltyPointsPlugin;
    }

    static emailHandlers = [loyaltyPointsRedeemHandler, loyaltyPointsEarnHandler];
}
