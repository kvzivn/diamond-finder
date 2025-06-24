import type {
  Diamond,
  DiamondType,
  CachedDiamonds,
} from '../models/diamond.server';

/**
 * @deprecated This service is deprecated. Use diamond-db.server.ts for database operations.
 *
 * This file is kept for backward compatibility during migration.
 * All diamond data is now stored in PostgreSQL database.
 */

// Store the cache in a simple object.
// In a real-world app, for multi-instance environments (like serverless),
// you'd replace this with a shared cache like Redis, Cloudflare KV, etc.
const globalCache: Partial<Record<DiamondType, CachedDiamonds>> = {};

const CACHE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

/**
 * @deprecated Use getDiamondsByType from diamond-db.server.ts instead
 * Retrieves diamonds from the cache if available and still valid.
 * @param type - The type of diamonds to retrieve ('natural' or 'lab').
 * @returns The cached diamond data or null if not found or expired.
 */
export function getCachedDiamonds(type: DiamondType): Diamond[] | null {
  console.warn(
    `[DEPRECATED] getCachedDiamonds is deprecated. Use getDiamondsByType from diamond-db.server.ts instead.`
  );
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

  console.log(
    `Cache hit for ${type} diamonds. Fetched ${cacheEntry.data.length} items.`
  );
  return cacheEntry.data;
}

/**
 * @deprecated Diamond data is now stored in the database
 * Stores diamond data into the cache.
 * @param type - The type of diamonds to store ('natural' or 'lab').
 * @param data - The array of diamond objects to store.
 */
export function setCachedDiamonds(type: DiamondType, data: Diamond[]): void {
  console.warn(
    `[DEPRECATED] setCachedDiamonds is deprecated. Diamonds are now stored in the database.`
  );
  globalCache[type] = {
    data,
    fetchedAt: new Date(),
  };
  console.log(
    `Cached ${data.length} ${type} diamonds at ${globalCache[type]?.fetchedAt.toISOString()}.`
  );
}

/**
 * @deprecated Use database queries to check diamond availability
 * Checks if the cache for a given diamond type is still valid.
 * @param type - The type of diamonds to check ('natural' or 'lab').
 * @returns True if the cache is valid, false otherwise.
 */
export function isCacheValid(type: DiamondType): boolean {
  console.warn(
    `[DEPRECATED] isCacheValid is deprecated. Use database queries instead.`
  );
  const cacheEntry = globalCache[type];
  if (!cacheEntry) {
    return false;
  }
  const now = new Date();
  const cacheAge = now.getTime() - cacheEntry.fetchedAt.getTime();
  return cacheAge <= CACHE_DURATION_MS;
}

/**
 * @deprecated Use clearDiamondsByType from diamond-db.server.ts instead
 * Utility function to clear a specific cache entry, e.g., for testing or forced refresh.
 * @param type - The type of diamonds cache to clear.
 */
export function clearCache(type: DiamondType): void {
  console.warn(
    `[DEPRECATED] clearCache is deprecated. Use clearDiamondsByType from diamond-db.server.ts instead.`
  );
  if (globalCache[type]) {
    delete globalCache[type];
    console.log(`Cache for ${type} diamonds cleared.`);
  } else {
    console.log(`No cache found for ${type} diamonds to clear.`);
  }
}

/**
 * @deprecated Diamond data is now managed in the database
 * Utility function to clear all diamond caches.
 */
export function clearAllCache(): void {
  console.warn(
    `[DEPRECATED] clearAllCache is deprecated. Diamond data is now managed in the database.`
  );
  delete globalCache.natural;
  delete globalCache.lab;
  console.log('All diamond caches cleared.');
}
