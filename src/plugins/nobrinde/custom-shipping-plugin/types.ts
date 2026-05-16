export type ZoneRateEntry = {
    zoneName: string;
    pricePerKgEUR: number;
    /** Enable free shipping logic for this zone. */
    freeShipping: boolean;
    /** Minimum order amount in EUR to apply free shipping when `freeShipping` is true. */
    minAmountEUR: number;
    /** When true, customer cannot pay until an admin sets a shipping quote. */
    quoteEnabled: boolean;
};

export const DEFAULT_ZONE_RATES: ZoneRateEntry[] = [
    { zoneName: 'Portugal Islands',  pricePerKgEUR: 0, freeShipping: false, minAmountEUR: 0, quoteEnabled: false },
    { zoneName: 'Portugal Mainland', pricePerKgEUR: 0, freeShipping: false, minAmountEUR: 0, quoteEnabled: false },
    { zoneName: 'Spain',             pricePerKgEUR: 0, freeShipping: false, minAmountEUR: 0, quoteEnabled: false },
    { zoneName: 'France',            pricePerKgEUR: 0, freeShipping: false, minAmountEUR: 0, quoteEnabled: false },
    { zoneName: 'Europe',            pricePerKgEUR: 0, freeShipping: false, minAmountEUR: 0, quoteEnabled: false },
    { zoneName: 'Out of Europe',     pricePerKgEUR: 0, freeShipping: false, minAmountEUR: 0, quoteEnabled: true  },
];

export const parseZoneRates = (raw: string): ZoneRateEntry[] => {
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(item => {
            const row = (item ?? {}) as Record<string, unknown>;
            const threshold = Number(row.freeShippingThresholdEUR ?? 0);
            const minAmountEUR = Number.isFinite(Number(row.minAmountEUR))
                ? Number(row.minAmountEUR)
                : Number.isFinite(threshold)
                  ? threshold
                  : 0;
            const freeShipping =
                row.freeShipping === true || (row.freeShipping === undefined && minAmountEUR > 0);
            // accept both new name and legacy name
            const quoteEnabled = row.quoteEnabled === true || row.requiresManualQuote === true;
            return {
                zoneName: String(row.zoneName ?? '').trim(),
                pricePerKgEUR: Number(row.pricePerKgEUR ?? 0) || 0,
                freeShipping,
                minAmountEUR: Math.max(0, minAmountEUR),
                quoteEnabled,
            };
        });
    } catch {
        return [];
    }
};
