import { Injectable } from '@nestjs/common';
import {
    ChannelService,
    CountryService,
    ID,
    LanguageCode,
    Logger,
    RequestContext,
    RequestContextService,
    ShippingMethod,
    ShippingMethodService,
    TransactionalConnection,
    ZoneService,
} from '@vendure/core';

import { customShippingCalculator } from '../calculator/custom-shipping-calculator';
import { customShippingChecker } from '../checker/custom-shipping-checker';
import { customShippingFulfillmentHandler } from '../handler/custom-shipping-handler';
import { CUSTOM_SHIPPING_METHOD_CODE, loggerCtx } from '../constants';
import { DEFAULT_ZONE_RATES } from '../types';

// ---------------------------------------------------------------------------
// Static country data
// Only the countries required by the zone definitions are listed here.
// If Vendure's own seed data already contains these, they will be skipped.
// ---------------------------------------------------------------------------

const COUNTRY_DATA: Array<{ code: string; name: string }> = [
    { code: 'PT', name: 'Portugal' },
    { code: 'ES', name: 'Spain' },
    { code: 'FR', name: 'France' },
    { code: 'AL', name: 'Albania' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AT', name: 'Austria' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BA', name: 'Bosnia and Herzegovina' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'DK', name: 'Denmark' },
    { code: 'EE', name: 'Estonia' },
    { code: 'FI', name: 'Finland' },
    { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germany' },
    { code: 'GR', name: 'Greece' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IT', name: 'Italy' },
    { code: 'XK', name: 'Kosovo' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MT', name: 'Malta' },
    { code: 'MD', name: 'Moldova' },
    { code: 'MC', name: 'Monaco' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'MK', name: 'North Macedonia' },
    { code: 'NO', name: 'Norway' },
    { code: 'PL', name: 'Poland' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' },
    { code: 'SM', name: 'San Marino' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'TR', name: 'Turkey' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'VA', name: 'Vatican City' },
];

// ---------------------------------------------------------------------------
// Zone definitions — the mapping table
// ---------------------------------------------------------------------------

const EUROPE_COUNTRY_CODES = COUNTRY_DATA
    .map(c => c.code)
    .filter(code => !['PT', 'ES', 'FR'].includes(code));

// requiresManualQuote is now part of the zoneRates arg on the shipping method,
// not stored on the Zone entity. Zone definitions are routing-only.
type ZoneBootstrapDef = {
    name: string;
    countryCodes: string[];
    priority: number;
    quoteEnabled: boolean;
};

const ZONE_DEFINITIONS: ZoneBootstrapDef[] = [
    { name: 'Portugal Islands',  countryCodes: ['PT'],               priority: 0, quoteEnabled: false },
    { name: 'Portugal Mainland', countryCodes: ['PT'],               priority: 1, quoteEnabled: false },
    { name: 'Spain',             countryCodes: ['ES'],               priority: 2, quoteEnabled: false },
    { name: 'France',            countryCodes: ['FR'],               priority: 2, quoteEnabled: false },
    { name: 'Europe',            countryCodes: EUROPE_COUNTRY_CODES, priority: 3, quoteEnabled: false },
    { name: 'Out of Europe',     countryCodes: [],                   priority: 9, quoteEnabled: true  },
];

// ---------------------------------------------------------------------------

@Injectable()
export class CustomShippingBootstrapService {
    constructor(
        private readonly connection: TransactionalConnection,
        private readonly channelService: ChannelService,
        private readonly requestContextService: RequestContextService,
        private readonly shippingMethodService: ShippingMethodService,
        private readonly zoneService: ZoneService,
        private readonly countryService: CountryService,
    ) {}

    async bootstrap() {
        const ctx = await this.requestContextService.create({ apiType: 'admin' });
        await this.ensureCountriesExist(ctx);
        await this.ensureZonesExist(ctx);
        await this.ensureShippingMethodExists(ctx);
    }

    // -------------------------------------------------------------------------
    // Step 1 — Countries
    // -------------------------------------------------------------------------

    /**
     * Creates any missing Country records required by our zone definitions.
     * Existing countries are never modified.
     *
     * Uses raw SQL for the existence check to avoid TypeORM single-table
     * inheritance quirks with RequestContext-scoped repositories at bootstrap.
     */
    private async ensureCountriesExist(ctx: RequestContext) {
        // Raw SQL on the `region` table (TypeORM stores Country rows there with
        // discriminator = 'Country').
        const existing: Array<{ code: string }> = await this.connection.rawConnection.query(
            `SELECT code FROM region WHERE discriminator = 'Country'`,
        );
        const existingCodes = new Set(existing.map(r => r.code.toUpperCase()));

        const missing = COUNTRY_DATA.filter(c => !existingCodes.has(c.code.toUpperCase()));

        if (missing.length === 0) {
            Logger.debug(`All ${COUNTRY_DATA.length} countries already present`, loggerCtx);
            return;
        }

        Logger.info(`Creating ${missing.length} missing countries…`, loggerCtx);

        for (const { code, name } of missing) {
            await this.countryService.create(ctx, {
                code,
                enabled: true,
                translations: [
                    { languageCode: LanguageCode.en, name },
                    { languageCode: LanguageCode.pt, name },
                ],
            });
            Logger.debug(`Country created: ${code} — ${name}`, loggerCtx);
        }

        Logger.info(`Countries ready`, loggerCtx);
    }

    // -------------------------------------------------------------------------
    // Step 2 — Zones
    // -------------------------------------------------------------------------

    /**
     * Creates shipping zones with their country members.
     * - Skips zones that already exist AND have members.
     * - Backfills zones that exist but have 0 members (from a previous failed boot).
     */
    private async ensureZonesExist(ctx: RequestContext) {
        // Raw SQL lookup so we always get IDs regardless of ORM context issues.
        const countryRows: Array<{ id: string; code: string }> = await this.connection.rawConnection.query(
            `SELECT id, code FROM region WHERE discriminator = 'Country'`,
        );
        const idByCode = new Map<string, ID>(countryRows.map(r => [r.code.toUpperCase(), r.id]));

        const existingZones = await this.zoneService.getAllWithMembers(ctx);
        const existingByName = new Map(existingZones.map(z => [z.name, z]));

        for (const def of ZONE_DEFINITIONS) {
            const memberIds = def.countryCodes
                .map(code => idByCode.get(code.toUpperCase()))
                .filter((id): id is ID => id !== undefined);

            const existing = existingByName.get(def.name);

            if (!existing) {
                await this.zoneService.create(ctx, {
                    name: def.name,
                    memberIds,
                    customFields: {
                        shippingZonePriority: def.priority,
                        quoteEnabled: def.quoteEnabled,
                    } as any,
                });
                Logger.info(`Zone "${def.name}" created (${memberIds.length} countries)`, loggerCtx);
            } else if (memberIds.length > 0 && (!existing.members || existing.members.length === 0)) {
                await this.zoneService.addMembersToZone(ctx, { zoneId: existing.id, memberIds });
                Logger.info(`Zone "${def.name}" backfilled with ${memberIds.length} countries`, loggerCtx);
            } else {
                Logger.debug(`Zone "${def.name}" already configured — skipping`, loggerCtx);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Step 3 — Shipping method
    // -------------------------------------------------------------------------

    private async ensureShippingMethodExists(ctx: RequestContext) {
        const exists = await this.connection.rawConnection
            .getRepository(ShippingMethod)
            .findOne({ where: { code: CUSTOM_SHIPPING_METHOD_CODE } });

        if (exists) return;

        const defaultChannel = await this.channelService.getDefaultChannel(ctx);

        const created = await this.shippingMethodService.create(ctx, {
            code: CUSTOM_SHIPPING_METHOD_CODE,
            fulfillmentHandler: customShippingFulfillmentHandler.code,
            checker: {
                code: customShippingChecker.code,
                arguments: [
                    { name: 'minWeightKg', value: '0' },
                    { name: 'maxWeightKg', value: '200' },
                ],
            },
            calculator: {
                code: customShippingCalculator.code,
                arguments: [
                    { name: 'zoneRates', value: JSON.stringify(DEFAULT_ZONE_RATES, null, 2) },
                ],
            },
            translations: [
                { languageCode: LanguageCode.en, name: 'Custom Shipping' },
                { languageCode: LanguageCode.pt, name: 'Envio Personalizado' },
            ],
        });

        await this.channelService.assignToChannels(ctx, ShippingMethod, created.id, [defaultChannel.id]);
        Logger.info(`Shipping method "${CUSTOM_SHIPPING_METHOD_CODE}" created`, loggerCtx);
    }
}
