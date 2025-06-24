import type { DiamondType } from '../models/diamond.server';
import { fetchDiamondsStream } from './idex.service.server';
import {
  createImportJob,
  updateImportJobStatus,
  clearDiamondsByType,
  importDiamondsBatch,
  getDiamondsByType,
} from './diamond-db.server';
import { ImportStatus } from '@prisma/client';

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
 * Refreshes the diamonds in the database for a specific type.
 * Prevents concurrent updates for the same diamond type.
 * @param type - The type of diamonds to refresh ('natural' or 'lab').
 * @param force - Whether to force a refresh (always true for database imports).
 * @returns Promise<UpdateStatus>
 */
export async function refreshDiamondsByType(
  type: DiamondType,
  force: boolean = true
): Promise<UpdateStatus> {
  console.log(`Refresh requested for ${type} diamonds. Force: ${force}`);

  // Check if update is already in progress
  let isUpdateInProgressFlag =
    type === 'natural' ? isUpdateInProgressNatural : isUpdateInProgressLab;
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

  const importJobId = await createImportJob(type);
  console.log(
    `Starting database import for ${type} diamonds. Job ID: ${importJobId}`
  );

  try {
    // Update job status to in progress
    await updateImportJobStatus(importJobId, ImportStatus.IN_PROGRESS, {
      startedAt: new Date(),
    });

    // Clear existing diamonds of this type
    const deletedCount = await clearDiamondsByType(type);
    console.log(
      `Cleared ${deletedCount} existing ${type} diamonds from database.`
    );

    // Fetch and import diamonds in chunks
    let totalImported = 0;
    const diamondStream = fetchDiamondsStream(type);

    for await (const diamondChunk of diamondStream) {
      const importedCount = await importDiamondsBatch(
        diamondChunk,
        type,
        importJobId
      );
      totalImported += importedCount;
      console.log(
        `Progress: Imported ${totalImported} ${type} diamonds so far...`
      );
    }

    // Update job status to completed
    await updateImportJobStatus(importJobId, ImportStatus.COMPLETED, {
      totalRecords: totalImported,
      processedRecords: totalImported,
      completedAt: new Date(),
    });

    console.log(
      `Successfully imported ${totalImported} ${type} diamonds to database.`
    );

    return {
      type,
      success: true,
      message: `Successfully updated ${type} diamonds. Imported ${totalImported} items.`,
      updatedCount: totalImported,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error refreshing ${type} diamonds:`, error);

    // Update job status to failed
    await updateImportJobStatus(importJobId, ImportStatus.FAILED, {
      error:
        error instanceof Error ? error.message : 'Unknown error during import.',
      completedAt: new Date(),
    });

    return {
      type,
      success: false,
      message:
        error instanceof Error ? error.message : 'Unknown error during update.',
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
 * Refreshes diamonds for all types (natural and lab) in the database.
 * @param force - Whether to force a refresh (always true for database imports).
 * @returns Promise<UpdateStatus[]>
 */
export async function refreshAllDiamonds(
  force: boolean = true
): Promise<UpdateStatus[]> {
  console.log(`Full database refresh requested. Force: ${force}`);
  const naturalStatus = await refreshDiamondsByType('natural', force);
  const labStatus = await refreshDiamondsByType('lab', force);
  return [naturalStatus, labStatus];
}

/**
 * Get the current count of diamonds in the database by type.
 * @param type - The type of diamonds to count.
 * @returns Promise<number>
 */
export async function getDiamondCount(type: DiamondType): Promise<number> {
  const { totalCount } = await getDiamondsByType(type, 0, 1);
  return totalCount;
}

// For backward compatibility - redirect old function names
export const refreshDiamondCacheByType = refreshDiamondsByType;
export const refreshAllDiamondCaches = refreshAllDiamonds;
