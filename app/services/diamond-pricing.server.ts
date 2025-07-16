import type { DiamondType } from '../models/diamond.server';

interface CaratRange {
  min: number;
  max: number;
  multiplier: number;
}

// Markup configuration based on the provided table
const NATURAL_DIAMOND_MARKUPS: CaratRange[] = [
  { min: 0, max: 0.5, multiplier: 2.8 },
  { min: 0.5, max: 0.7, multiplier: 2.7 },
  { min: 0.7, max: 1, multiplier: 2.65 },
  { min: 1, max: 1.1, multiplier: 2.5 },
  { min: 1.1, max: 1.5, multiplier: 2.45 },
  { min: 1.5, max: 2, multiplier: 2.4 },
  { min: 2, max: 3, multiplier: 2.3 },
  { min: 3, max: 5, multiplier: 2.25 },
  { min: 5, max: 150, multiplier: 2.18 },
];

const LAB_GROWN_DIAMOND_MARKUPS: CaratRange[] = [
  { min: 0, max: 0.5, multiplier: 3.5 },
  { min: 0.5, max: 0.7, multiplier: 3.0 },
  { min: 0.7, max: 1, multiplier: 2.9 },
  { min: 1, max: 1.1, multiplier: 2.8 },
  { min: 1.1, max: 1.5, multiplier: 2.75 },
  { min: 1.5, max: 2, multiplier: 2.6 },
  { min: 2, max: 3, multiplier: 2.5 },
  { min: 3, max: 5, multiplier: 2.4 },
  { min: 5, max: 150, multiplier: 2.3 },
];

/**
 * Gets the markup multiplier for a diamond based on its carat and type
 * @param carat The carat weight of the diamond
 * @param type The type of diamond ('natural' or 'lab')
 * @returns The multiplier to apply to the base price (e.g., 1.80 for 80% markup)
 */
export function getMarkupMultiplier(carat: number, type: DiamondType): number {
  if (!carat || carat <= 0) {
    console.warn(
      `[DIAMOND PRICING] Invalid carat value: ${carat}, using default multiplier`
    );
    return type === 'natural' ? 2.8 : 3.5; // Default to smallest range multiplier
  }

  const markupRanges =
    type === 'natural' ? NATURAL_DIAMOND_MARKUPS : LAB_GROWN_DIAMOND_MARKUPS;

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
    console.warn(
      `[DIAMOND PRICING] No markup range found for carat: ${carat}, type: ${type}, using default multiplier`
    );
    return type === 'natural' ? 2.18 : 2.3; // Default to largest range multiplier
  }

  return range.multiplier;
}

/**
 * Calculates the final price with markup applied and rounded to nearest 100 SEK
 * @param basePriceSek The base price in SEK before markup
 * @param carat The carat weight of the diamond
 * @param type The type of diamond ('natural' or 'lab')
 * @returns The final price in SEK, rounded to nearest 100
 */
export function calculateFinalPriceSek(
  basePriceSek: number,
  carat: number,
  type: DiamondType
): number {
  if (!basePriceSek || basePriceSek <= 0) {
    console.warn(`[DIAMOND PRICING] Invalid base price: ${basePriceSek}`);
    return 0;
  }

  const multiplier = getMarkupMultiplier(carat, type);
  const priceWithMarkup = basePriceSek * multiplier;

  // Round to nearest 100 SEK
  const finalPrice = Math.round(priceWithMarkup / 100) * 100;

  return finalPrice;
}

/**
 * Gets the markup percentage for a diamond based on its carat and type
 * @param carat The carat weight of the diamond
 * @param type The type of diamond ('natural' or 'lab')
 * @returns The markup percentage (e.g., 80 for 80% markup)
 */
export function getMarkupPercent(carat: number, type: DiamondType): number {
  const multiplier = getMarkupMultiplier(carat, type);
  return Math.round((multiplier - 1) * 100);
}
