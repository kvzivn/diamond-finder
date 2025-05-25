import type { Diamond, DiamondType, CachedDiamonds } from '../models/diamond.server';

// Store the cache in a simple object.
// In a real-world app, for multi-instance environments (like serverless),
// you'd replace this with a shared cache like Redis, Cloudflare KV, etc.
const globalCache: Partial<Record<DiamondType, CachedDiamonds>> = {};

const CACHE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

/**
 * Retrieves diamonds from the cache if available and still valid.
 * @param type - The type of diamonds to retrieve ('natural' or 'lab').
 * @returns The cached diamond data or null if not found or expired.
 */
export function getCachedDiamonds(type: DiamondType): Diamond[] | null {
  const cacheEntry = globalCache[type];
  if (!cacheEntry) {
    console.log(`Cache miss for ${type} diamonds: No entry found.`);
    return null;
  }

  const now = new Date();
  const cacheAge = now.getTime() - cacheEntry.fetchedAt.getTime();

  if (cacheAge > CACHE_DURATION_MS) {
    console.log(`Cache miss for ${type} diamonds: Cache expired.`);
    // Optionally, you could clear the cache entry here: delete globalCache[type];
    return null;
  }

  console.log(`Cache hit for ${type} diamonds. Fetched ${cacheEntry.data.length} items.`);
  return cacheEntry.data;
}

/**
 * Stores diamond data into the cache.
 * @param type - The type of diamonds to store ('natural' or 'lab').
 * @param data - The array of diamond objects to store.
 */
export function setCachedDiamonds(type: DiamondType, data: Diamond[]): void {
  globalCache[type] = {
    data,
    fetchedAt: new Date(),
  };
  console.log(`Cached ${data.length} ${type} diamonds at ${globalCache[type]?.fetchedAt.toISOString()}.`);
}

/**
 * Checks if the cache for a given diamond type is still valid.
 * @param type - The type of diamonds to check ('natural' or 'lab').
 * @returns True if the cache is valid, false otherwise.
 */
export function isCacheValid(type: DiamondType): boolean {
  const cacheEntry = globalCache[type];
  if (!cacheEntry) {
    return false;
  }
  const now = new Date();
  const cacheAge = now.getTime() - cacheEntry.fetchedAt.getTime();
  return cacheAge <= CACHE_DURATION_MS;
}

/**
 * Utility function to clear a specific cache entry, e.g., for testing or forced refresh.
 * @param type - The type of diamonds cache to clear.
 */
export function clearCache(type: DiamondType): void {
    if (globalCache[type]) {
        delete globalCache[type];
        console.log(`Cache for ${type} diamonds cleared.`);
    } else {
        console.log(`No cache found for ${type} diamonds to clear.`);
    }
}

/**
 * Utility function to clear all diamond caches.
 */
export function clearAllCache(): void {
    delete globalCache.natural;
    delete globalCache.lab;
    console.log("All diamond caches cleared.");
}