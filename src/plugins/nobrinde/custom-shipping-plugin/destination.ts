import { Order, RequestContext, TransactionalConnection, Zone } from '@vendure/core';

/**
 * Routing-only Zone custom fields used by this plugin.
 * Pricing lives in the calculator/checker `zoneRates` arg — not here.
 */
export type ShippingZoneFields = {
  /**
   * Lower value = higher priority when a country belongs to multiple zones.
   * Portugal Islands (0) must be lower than Portugal Mainland (1).
   */
  shippingZonePriority: number;
  /** When true, customers cannot select this shipping method. Admin must set a quote manually. */
  quoteEnabled: boolean;
};

export type ResolvedShippingZone = Zone & { customFields: ShippingZoneFields };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sanitizePostalCode = (postalCode?: string | null): string =>
  String(postalCode ?? '').replace(/[^\d]/g, '');

/**
 * Returns true if the zone name indicates a Portugal Islands zone.
 * Matches names containing "island" or "ilha" (case-insensitive).
 */
const isPortugalIslandsZone = (name: string): boolean => /island|ilha/i.test(name);

/** Returns true for Madeira (9000-9399) and Azores (9500-9999) postal codes. */
const isPortugalIslandsPostalCode = (postalCode?: string | null): boolean => {
  const numeric = sanitizePostalCode(postalCode);
  if (!numeric) return false;
  const prefix = parseInt(numeric.slice(0, 4), 10);
  if (isNaN(prefix)) return false;
  return (prefix >= 9000 && prefix <= 9399) || (prefix >= 9500 && prefix <= 9999);
};

export const getOrderWeightKg = (order: Order): number =>
  order.lines.reduce((acc, line) => {
    const vw = Number(line.productVariant.customFields?.weight ?? 0);
    const pw = Number(line.productVariant.product?.customFields?.weight ?? 0);
    const w = vw > 0 ? vw : pw > 0 ? pw : 0;
    return acc + w * line.quantity;
  }, 0);

// ---------------------------------------------------------------------------
// Zone resolver
// ---------------------------------------------------------------------------

/**
 * Resolves the best-matching Vendure Zone for the order's shipping address.
 *
 * @param allowedZoneNames - Only consider zones whose names are in this list
 *   (derived from the `zoneRates` arg on the shipping method).
 *
 * Resolution order:
 * 1. Load all Zones that are in `allowedZoneNames`.
 * 2. Sort by shippingZonePriority ascending (lower = higher priority).
 * 3. For each zone:
 *    a. If the zone name identifies it as a Portugal Islands zone AND the address is a PT island → match.
 *    b. If the zone name identifies it as a Portugal Islands zone AND address is NOT an island → skip.
 *    c. Otherwise match if the country code is a member of the zone.
 * 4. Return the first match, or null if no zone covers this address.
 */
export const resolveShippingZone = async (
  ctx: RequestContext,
  order: Order,
  connection: TransactionalConnection,
  allowedZoneNames: string[],
): Promise<ResolvedShippingZone | null> => {
  const countryCode = String(order.shippingAddress?.countryCode ?? '')
    .trim()
    .toUpperCase();
  if (!countryCode || allowedZoneNames.length === 0) return null;

  const allZones = await connection.getRepository(ctx, Zone).find({
    relations: ['members'],
  });

  // Keep only zones configured in this shipping method's zoneRates.
  const shippingZones = allZones.filter(z => allowedZoneNames.includes(z.name)) as ResolvedShippingZone[];

  // Sort by priority (lower = first).
  shippingZones.sort(
    (a, b) =>
      (Number(a.customFields.shippingZonePriority) || 0) - (Number(b.customFields.shippingZonePriority) || 0),
  );

  const postalCode = order.shippingAddress?.postalCode;
  const isIslandAddress = countryCode === 'PT' && isPortugalIslandsPostalCode(postalCode);

  for (const zone of shippingZones) {
    if (isPortugalIslandsZone(zone.name)) {
      // This zone is specifically for PT islands.
      if (isIslandAddress) return zone;
      continue; // do NOT let it catch non-island PT addresses
    }

    const memberCodes = new Set(zone.members.map(m => m.code.trim().toUpperCase()));
    if (memberCodes.has(countryCode)) return zone;
  }

  return null; // no zone covers this address → not eligible
};

/**
 * Finds the highest-priority zone that contains the given country code,
 * without restricting to a specific shipping method's allowed zone names.
 * Applies the same Portugal Islands postal code logic as resolveShippingZone.
 */
export const findZoneForCountry = async (
  ctx: RequestContext,
  countryCode: string,
  postalCode: string | null | undefined,
  connection: TransactionalConnection,
): Promise<ResolvedShippingZone | null> => {
  const code = String(countryCode ?? '').trim().toUpperCase();
  if (!code) return null;

  const allZones = (await connection.getRepository(ctx, Zone).find({
    relations: ['members'],
  })) as ResolvedShippingZone[];

  allZones.sort(
    (a, b) =>
      (Number(a.customFields?.shippingZonePriority) || 0) -
      (Number(b.customFields?.shippingZonePriority) || 0),
  );

  const isIslandAddress = code === 'PT' && isPortugalIslandsPostalCode(postalCode);

  for (const zone of allZones) {
    if (isPortugalIslandsZone(zone.name)) {
      if (isIslandAddress) return zone;
      continue;
    }
    const memberCodes = new Set(zone.members.map(m => m.code.trim().toUpperCase()));
    if (memberCodes.has(code)) return zone;
  }

  return null;
};
