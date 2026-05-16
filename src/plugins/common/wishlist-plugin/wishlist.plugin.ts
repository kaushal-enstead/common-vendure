import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';

import { Module } from '@nestjs/common';
import { shopApiExtensions } from './api/api-extensions';
import { WishlistShopResolver } from './api/wishlist-shop.resolver';
import { WISHLIST_PLUGIN_OPTIONS } from './constants';
import { Wishlist } from './entities/wishlist.entity';
import { WishlistService } from './services/wishlist.service';
import { PluginInitOptions } from './types';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [
        {
            provide: WISHLIST_PLUGIN_OPTIONS,
            useFactory: () => WishlistPlugin.options,
        },
        WishlistService,
    ],
    configuration: config => {
        // Plugin-specific configuration
        // such as custom fields, custom permissions,
        // strategies etc. can be configured here by
        // modifying the `config` object.
        return config;
    },
    compatibility: '^3.0.0',
    entities: [Wishlist],
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [WishlistShopResolver],
    },
})
export class WishlistPlugin {
    static options: PluginInitOptions;

    static init(options: PluginInitOptions): Type<WishlistPlugin> {
        this.options = options;
        return WishlistPlugin;
    }
}

@Module({
    imports: [PluginCommonModule],
    providers: [
        {
            provide: WISHLIST_PLUGIN_OPTIONS,
            useFactory: () => WishlistPlugin.options,
        },
        WishlistService,
    ],
    exports: [WishlistService],
})
export class WishlistPluginModule {}
