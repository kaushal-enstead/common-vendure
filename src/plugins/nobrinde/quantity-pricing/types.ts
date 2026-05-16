/**
 * A single quantity price tier: when order quantity is within
 * [quantityStart, quantityEnd] (inclusive), this price applies per unit.
 */
export interface QuantityPriceTier {
  /** Price per unit in the channel's smallest currency unit (e.g. cents). */
  price: number;
  /** Start of quantity range (inclusive). */
  quantityStart: number;
  /** End of quantity range (inclusive). */
  quantityEnd: number;
}

export type QuantityPriceTiers = QuantityPriceTier[];
