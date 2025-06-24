import type { DiamondType } from '../models/diamond.server';

interface CaratRange {
  min: number;
  max: number;
  markupPercent: number;
  multiplier: number;
}

// Markup configuration based on the provided table
const NATURAL_DIAMOND_MARKUPS: CaratRange[] = [
  { min: 0, max: 0.5, markupPercent: 80, multiplier: 1.8 },
  { min: 0.5, max: 0.7, markupPercent: 70, multiplier: 1.7 },
  { min: 0.7, max: 1, markupPercent: 65, multiplier: 1.65 },
  { min: 1, max: 1.1, markupPercent: 50, multiplier: 1.5 },
  { min: 1.1, max: 1.5, markupPercent: 45, multiplier: 1.45 },
  { min: 1.5, max: 2, markupPercent: 40, multiplier: 1.4 },
  { min: 2, max: 3, markupPercent: 30, multiplier: 1.3 },
  { min: 3, max: 5, markupPercent: 25, multiplier: 1.25 },
  { min: 5, max: 150, markupPercent: 18, multiplier: 1.18 },
];

const LAB_GROWN_DIAMOND_MARKUPS: CaratRange[] = [
  { min: 0, max: 0.5, markupPercent: 150, multiplier: 2.5 },
  { min: 0.5, max: 0.7, markupPercent: 100, multiplier: 2.0 },
  { min: 0.7, max: 1, markupPercent: 90, multiplier: 1.9 },
  { min: 1, max: 1.1, markupPercent: 80, multiplier: 1.8 },
  { min: 1.1, max: 1.5, markupPercent: 75, multiplier: 1.75 },
  { min: 1.5, max: 2, markupPercent: 60, multiplier: 1.6 },
  { min: 2, max: 3, markupPercent: 50, multiplier: 1.5 },
  { min: 3, max: 5, markupPercent: 40, multiplier: 1.4 },
  { min: 5, max: 150, markupPercent: 30, multiplier: 1.3 },
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
    return type === 'natural' ? 1.8 : 2.5; // Default to smallest range multiplier
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
    return type === 'natural' ? 1.18 : 1.3; // Default to largest range multiplier
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
