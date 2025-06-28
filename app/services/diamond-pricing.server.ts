// No imports needed for simplified pricing

// Simplified markup configuration - 100% markup for all diamonds
const MARKUP_MULTIPLIER = 2.0;
const MARKUP_PERCENT = 100;

/**
 * Gets the markup multiplier for a diamond
 * @param carat The carat weight of the diamond (unused but kept for compatibility)
 * @returns The multiplier to apply to the base price (2.0 for 100% markup)
 */
export function getMarkupMultiplier(carat: number): number {
  if (!carat || carat <= 0) {
    console.warn(
      `[DIAMOND PRICING] Invalid carat value: ${carat}, using default multiplier`
    );
  }

  return MARKUP_MULTIPLIER;
}

/**
 * Calculates the final price with markup applied and rounded to nearest 100 SEK
 * @param basePriceSek The base price in SEK before markup
 * @param carat The carat weight of the diamond (unused but kept for compatibility)
 * @returns The final price in SEK, rounded to nearest 100
 */
export function calculateFinalPriceSek(
  basePriceSek: number,
  carat: number
): number {
  if (!basePriceSek || basePriceSek <= 0) {
    console.warn(`[DIAMOND PRICING] Invalid base price: ${basePriceSek}`);
    return 0;
  }

  const multiplier = getMarkupMultiplier(carat);
  const priceWithMarkup = basePriceSek * multiplier;

  // Round to nearest 100 SEK
  const finalPrice = Math.round(priceWithMarkup / 100) * 100;

  return finalPrice;
}

/**
 * Gets the markup percentage for a diamond
 * @returns The markup percentage (100 for 100% markup)
 */
export function getMarkupPercent(): number {
  return MARKUP_PERCENT;
}
