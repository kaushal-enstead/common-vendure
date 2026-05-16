import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { Module } from '@nestjs/common';
import { shopApiExtensions } from './api/api-extensions';
import { CustomFacetService } from './services/custom-facet.service';
import { CustomFacetShopResolver } from './api/custom-facet.shop.resolver';
import { PluginInitOptions } from './types';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [CustomFacetService],
    configuration: config => {
        return config;
    },
    compatibility: '^3.0.0',
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [CustomFacetShopResolver],
    },
})
export class CustomFacetPlugin {
    static options: PluginInitOptions;

    static init(options: PluginInitOptions): Type<CustomFacetPlugin> {
        this.options = options;
        return CustomFacetPlugin;
    }
}

@Module({
    imports: [PluginCommonModule],
    providers: [CustomFacetService],
    exports: [CustomFacetService],
})
export class CustomFacetPluginModule {}
