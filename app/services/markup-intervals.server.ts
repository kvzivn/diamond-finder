import prisma from '../db.server';
import type { DiamondType } from '../models/diamond.server';
import type { CaratRange } from './diamond-pricing.server';

let intervalCache: Map<DiamondType, CaratRange[]> = new Map();
let lastCacheUpdate = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches markup intervals from database for a specific diamond type
 */
export async function getMarkupIntervals(type: DiamondType): Promise<CaratRange[]> {
  const now = Date.now();
  
  // Use cache if it's still valid
  if (intervalCache.has(type) && (now - lastCacheUpdate) < CACHE_TTL) {
    return intervalCache.get(type)!;
  }

  try {
    const intervals = await prisma.markupInterval.findMany({
      where: { type },
      orderBy: { minCarat: 'asc' },
    });

    const caratRanges: CaratRange[] = intervals.map((interval: any) => ({
      min: interval.minCarat,
      max: interval.maxCarat,
      multiplier: interval.multiplier,
    }));

    // Update cache
    intervalCache.set(type, caratRanges);
    lastCacheUpdate = now;

    console.log(`[MARKUP INTERVALS] Loaded ${caratRanges.length} intervals for ${type} diamonds`);
    return caratRanges;
  } catch (error) {
    console.error(`[MARKUP INTERVALS] Error fetching intervals for ${type}:`, error);
    
    // Return fallback intervals if database is unavailable
    return getFallbackIntervals(type);
  }
}

/**
 * Clears the interval cache - call this after updating intervals
 */
export function clearIntervalCache(): void {
  intervalCache.clear();
  lastCacheUpdate = 0;
  console.log('[MARKUP INTERVALS] Cache cleared');
}

/**
 * Fallback intervals in case database is unavailable
 */
function getFallbackIntervals(type: DiamondType): CaratRange[] {
  console.warn(`[MARKUP INTERVALS] Using fallback intervals for ${type} diamonds`);
  
  // Return granular 0.1 carat intervals with 1.0 multiplier as fallback
  const intervals: CaratRange[] = [];
  
  for (let i = 0; i < 50; i++) {
    const minCarat = i * 0.1;
    const maxCarat = minCarat + 0.09;
    
    // Special case for last interval to go up to 5.00
    if (i === 49) {
      intervals.push({ min: 4.9, max: 5.0, multiplier: 1.0 });
    } else {
      intervals.push({ min: minCarat, max: maxCarat, multiplier: 1.0 });
    }
  }
  
  return intervals;
}

/**
 * Seeds the database with default granular intervals (0.1 carat intervals)
 * This is useful for initial setup or resetting intervals
 */
export async function seedDefaultIntervals(): Promise<void> {
  const types: DiamondType[] = ['natural', 'lab'];
  
  for (const type of types) {
    const intervals = [];
    
    for (let i = 0; i < 50; i++) {
      const minCarat = i * 0.1;
      const maxCarat = minCarat + 0.09;
      
      // Special case for last interval
      if (i === 49) {
        intervals.push({
          id: `markup_${type}_490_500`,
          type,
          minCarat: 4.9,
          maxCarat: 5.0,
          multiplier: 1.0,
        });
      } else {
        const minStr = Math.floor(minCarat * 100).toString().padStart(2, '0');
        const maxStr = Math.floor(maxCarat * 100).toString().padStart(2, '0');
        
        intervals.push({
          id: `markup_${type}_${minStr}_${maxStr}`,
          type,
          minCarat,
          maxCarat,
          multiplier: 1.0,
        });
      }
    }
    
    // Upsert intervals
    for (const interval of intervals) {
      await prisma.markupInterval.upsert({
        where: {
          type_minCarat_maxCarat: {
            type: interval.type,
            minCarat: interval.minCarat,
            maxCarat: interval.maxCarat,
          },
        },
        update: {},
        create: interval,
      });
    }
    
    console.log(`[MARKUP INTERVALS] Seeded ${intervals.length} default intervals for ${type} diamonds`);
  }
  
  // Clear cache after seeding
  clearIntervalCache();
}