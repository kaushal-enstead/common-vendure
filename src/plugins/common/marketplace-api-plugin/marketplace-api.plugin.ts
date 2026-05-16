import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { SellersController } from './api/sellers.controller';
import { MARKETPLACE_API_SECRET } from './constants';
import { MarketplaceApiAuthGuard } from './guards/marketplace-api-auth.guard';
import { MarketplaceApiSellersService } from './services/marketplace-api-sellers.service';
import { PluginInitOptions } from './types';

@VendurePlugin({
    imports: [PluginCommonModule],
    controllers: [SellersController],
    providers: [
        MarketplaceApiAuthGuard,
        MarketplaceApiSellersService,
        {
            provide: MARKETPLACE_API_SECRET,
            useFactory: () => MarketplaceApiPlugin.options.sharedSecret,
        },
    ],
    compatibility: '^3.0.0',
})
export class MarketplaceApiPlugin {
    static options: PluginInitOptions;

    static init(options: PluginInitOptions): Type<MarketplaceApiPlugin> {
        this.options = options;
        return MarketplaceApiPlugin;
    }
}
