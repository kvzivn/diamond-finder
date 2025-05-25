import type { DiamondType } from '../models/diamond.server';
import { fetchDiamondsFromApi } from './idex.service.server';
import { setCachedDiamonds, isCacheValid, clearCache } from './diamond-cache.server';

interface UpdateStatus {
  type: DiamondType;
  success: boolean;
  message: string;
  updatedCount?: number;
  timestamp: string;
}

let isUpdateInProgressNatural = false;
let isUpdateInProgressLab = false;

/**
 * Refreshes the cache for a specific type of diamond if it's not already valid
 * or if a force refresh is requested.
 * Prevents concurrent updates for the same diamond type.
 * @param type - The type of diamonds to refresh ('natural' or 'lab').
 * @param force - Whether to force a refresh even if the cache is valid.
 * @returns Promise<UpdateStatus>
 */
export async function refreshDiamondCacheByType(type: DiamondType, force: boolean = false): Promise<UpdateStatus> {
  console.log(`Refresh requested for ${type} diamonds. Force: ${force}`);

  if (!force && isCacheValid(type)) {
    console.log(`Cache for ${type} diamonds is still valid. No update needed.`);
    return {
      type,
      success: true,
      message: 'Cache already valid and not forced.',
      timestamp: new Date().toISOString(),
    };
  }

  let isUpdateInProgressFlag = type === 'natural' ? isUpdateInProgressNatural : isUpdateInProgressLab;
  if (isUpdateInProgressFlag) {
    console.log(`Update for ${type} diamonds is already in progress.`);
    return {
      type,
      success: false,
      message: 'Update already in progress.',
      timestamp: new Date().toISOString(),
    };
  }

  // Set update in progress flag
  if (type === 'natural') {
    isUpdateInProgressNatural = true;
  } else {
    isUpdateInProgressLab = true;
  }

  console.log(`Starting cache refresh for ${type} diamonds...`);
  try {
    if (force) {
        console.log(`Forced refresh: Clearing existing cache for ${type} diamonds first.`);
        clearCache(type);
    }
    const diamonds = await fetchDiamondsFromApi(type);
    setCachedDiamonds(type, diamonds);
    console.log(`Successfully refreshed cache for ${type} diamonds. Count: ${diamonds.length}`);
    return {
      type,
      success: true,
      message: `Successfully updated ${type} diamonds. Fetched ${diamonds.length} items.`,
      updatedCount: diamonds.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error refreshing ${type} diamond cache:`, error);
    return {
      type,
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during update.',
      timestamp: new Date().toISOString(),
    };
  } finally {
    // Reset update in progress flag
    if (type === 'natural') {
      isUpdateInProgressNatural = false;
    } else {
      isUpdateInProgressLab = false;
    }
    console.log(`Update process finished for ${type} diamonds.`);
  }
}

/**
 * Refreshes the cache for all diamond types (natural and lab).
 * @param force - Whether to force a refresh even if the cache is valid.
 * @returns Promise<UpdateStatus[]>
 */
export async function refreshAllDiamondCaches(force: boolean = false): Promise<UpdateStatus[]> {
  console.log(`Full cache refresh requested. Force: ${force}`);
  const naturalStatus = await refreshDiamondCacheByType('natural', force);
  const labStatus = await refreshDiamondCacheByType('lab', force);
  return [naturalStatus, labStatus];
}