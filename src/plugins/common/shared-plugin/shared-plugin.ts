import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { SHARED_PLUGIN_OPTIONS } from './constants';
import { FreeGeoService } from './services/free-geo-service';
import { ORSService } from './services/ors-service';
import { PluginInitOptions } from './types';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [
        {
            provide: SHARED_PLUGIN_OPTIONS,
            useFactory: () => SharedPlugin.options,
        },
        FreeGeoService,
        ORSService,
    ],
    compatibility: '^3.0.0',
    entities: [],
    exports: [FreeGeoService, ORSService],
    configuration: config => {
        return config;
    },
})
export class SharedPlugin {
    static options: PluginInitOptions;

    static init(options: PluginInitOptions): Type<SharedPlugin> {
        this.options = options;

        return SharedPlugin;
    }
}
