import type { DiamondType } from '../models/diamond.server';
import {
  createImportJob,
  updateImportJobStatus,
  clearDiamondsByType,
  importDiamondsBatch,
  getDiamondsByType,
} from './diamond-db.server';
import { ImportStatus } from '@prisma/client';
import { setInterval, clearInterval } from 'timers';
import prisma from '../db.server';
import { fetchDiamondsStream } from './idex.service.server';

interface UpdateStatus {
  type: DiamondType;
  success: boolean;
  message: string;
  updatedCount?: number;
  timestamp: string;
}

/**
 * Get the shop domain from the most recent session
 */
async function getShopDomain(): Promise<string | null> {
  try {
    const session = await prisma.session.findFirst({
      where: {
        shop: {
          not: null
        }
      },
      orderBy: {
        expires: 'desc'
      }
    });
    return session?.shop || null;
  } catch (error) {
    console.error('[DIAMOND UPDATER] Error getting shop domain:', error);
    return null;
  }
}

/**
 * Refreshes the diamonds in the database for a specific type.
 * @param type - The type of diamonds to refresh ('natural' or 'lab').
 * @param force - Whether to force a refresh even if one is in progress.
 * @returns Promise<UpdateStatus>
 */
export async function refreshDiamondsByType(
  type: DiamondType,
  force: boolean = true
): Promise<UpdateStatus> {
  console.log(`Refreshing ${type} diamonds. Force: ${force}`);

  // Create keepalive interval to prevent auto-stopping during long imports
  const keepAlive = setInterval(() => {
    console.log(
      `[KEEPALIVE] Import in progress: ${type} diamonds... (prevents auto-stop)`
    );
  }, 30000); // Every 30 seconds

  try {
    // Check if there's an ongoing import for this type
    const ongoingJob = await prisma.importJob.findFirst({
      where: {
        type,
        status: ImportStatus.IN_PROGRESS,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (ongoingJob && !force) {
      console.log(
        `Import job already in progress for ${type} diamonds. Skipping.`
      );
      clearInterval(keepAlive);
      return {
        type,
        success: false,
        message: `Import already in progress for ${type} diamonds. Use force=true to override.`,
        timestamp: new Date().toISOString(),
      };
    }

    // Create a new import job
    const importJobId = await createImportJob(type);
    console.log(`Created import job ${importJobId} for ${type} diamonds.`);

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

      // Get shop domain for theme settings
      const shop = await getShopDomain();
      if (shop) {
        console.log(`[DIAMOND UPDATER] Using shop domain for theme settings: ${shop}`);
      } else {
        console.log('[DIAMOND UPDATER] No shop domain found, using default markup (0 multiplier)');
      }

      // Fetch and import diamonds in chunks
      let totalImported = 0;
      const diamondStream = fetchDiamondsStream(type, { 
        shop: shop || undefined,
        limit: 1000 // Temporary limit for testing
      });

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

      // Clear the keepalive interval
      clearInterval(keepAlive);

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
          error instanceof Error
            ? error.message
            : 'Unknown error during import.',
        completedAt: new Date(),
      });

      // Clear the keepalive interval
      clearInterval(keepAlive);

      return {
        type,
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unknown error during update.',
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error(`Error in refreshDiamondsByType for ${type}:`, error);
    clearInterval(keepAlive);
    throw error;
  }
}

/**
 * Refreshes diamonds for all types (natural and lab) in the database.
 * Sequential processing to reduce memory pressure on 256MB instances.
 * @param force - Whether to force a refresh (always true for database imports).
 * @returns Promise<UpdateStatus[]>
 */
export async function refreshAllDiamonds(
  force: boolean = true
): Promise<UpdateStatus[]> {
  console.log(`Sequential database refresh requested. Force: ${force}`);

  // Import natural diamonds first
  const naturalStatus = await refreshDiamondsByType('natural', force);

  // Add delay between diamond types to reduce memory pressure
  console.log(
    'Waiting 30 seconds before importing lab diamonds to reduce memory pressure...'
  );
  await new Promise((resolve) => setTimeout(resolve, 30000));

  // Then import lab diamonds
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
