import type { DiamondType } from '../models/diamond.server';

export interface CaratRange {
  min: number;
  max: number;
  multiplier: number;
}

/**
 * Gets the markup multiplier for a diamond based on its carat and type
 * @param carat The carat weight of the diamond
 * @param type The type of diamond ('natural' or 'lab')
 * @param markupRanges The markup ranges from theme settings
 * @returns The multiplier to apply to the base price (e.g., 1.80 for 80% markup)
 */
export function getMarkupMultiplier(
  carat: number, 
  type: DiamondType, 
  markupRanges: CaratRange[]
): number {
  if (!carat || carat <= 0) {
    return 0;
  }

  // Find the appropriate range (exclusive upper bound except for the last range)
  const range = markupRanges.find((range, index) => {
    if (index === markupRanges.length - 1) {
      // Last range includes the upper bound
      return carat >= range.min && carat <= range.max;
    } else {
      // Other ranges exclude the upper bound
      return carat >= range.min && carat < range.max;
    }
  });

  if (!range) {
    return 0;
  }

  return range.multiplier;
}

/**
 * Calculates the final price with markup applied and rounded to nearest 100 SEK
 * @param basePriceSek The base price in SEK before markup
 * @param carat The carat weight of the diamond
 * @param type The type of diamond ('natural' or 'lab')
 * @param markupRanges The markup ranges from theme settings
 * @returns The final price in SEK, rounded to nearest 100
 */
export function calculateFinalPriceSek(
  basePriceSek: number,
  carat: number,
  type: DiamondType,
  markupRanges: CaratRange[]
): number {
  if (!basePriceSek || basePriceSek <= 0) {
    return 0;
  }

  const multiplier = getMarkupMultiplier(carat, type, markupRanges);
  const priceWithMarkup = basePriceSek * multiplier;

  // Round to nearest 100 SEK
  const finalPrice = Math.round(priceWithMarkup / 100) * 100;

  return finalPrice;
}

/**
 * Gets the markup percentage for a diamond based on its carat and type
 * @param carat The carat weight of the diamond
 * @param type The type of diamond ('natural' or 'lab')
 * @param markupRanges The markup ranges from theme settings
 * @returns The markup percentage (e.g., 80 for 80% markup)
 */
export function getMarkupPercent(
  carat: number, 
  type: DiamondType, 
  markupRanges: CaratRange[]
): number {
  const multiplier = getMarkupMultiplier(carat, type, markupRanges);
  return Math.round((multiplier - 1) * 100);
}
