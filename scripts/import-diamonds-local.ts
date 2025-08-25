#!/usr/bin/env tsx
// Now import services that depend on Prisma
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { fetchDiamondsStream } from '../app/services/idex.service.server.js';
import type { DiamondType } from '../app/models/diamond.server.js';
import * as dotenv from 'dotenv';

// Load local environment variables first, then fallback to .env
dotenv.config({ path: '.env.local' });
dotenv.config();

// CRITICAL: Force DATABASE_URL to local before importing any Prisma-dependent services
const DATABASE_URL = process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL or DATABASE_URL_LOCAL environment variable is required'
  );
}

// Force the DATABASE_URL environment variable for all Prisma operations
process.env.DATABASE_URL = DATABASE_URL;
console.log(
  `[LOCAL-IMPORT] Forcing DATABASE_URL to: ${DATABASE_URL.replace(/\/\/[^@]*@/, '//***:***@')}`
);

const BATCH_SIZE = 1000; // 5x larger than production (200) due to 16GB vs 2GB RAM
const MAX_CONNECTIONS = 10; // More connections for local development

interface ImportStats {
  totalProcessed: number;
  totalInserted: number;
  errors: number;
  startTime: Date;
  importJobId: string;
}

class LocalDiamondImporter {
  private pool: Pool;
  private stats: ImportStats;
  private typeChangedCount: number = 0;

  constructor() {
    if (!DATABASE_URL) {
      throw new Error(
        'DATABASE_URL or DATABASE_URL_LOCAL environment variable is required'
      );
    }

    console.log(
      `[LOCAL-IMPORT] Using database: ${DATABASE_URL.replace(/\/\/[^@]*@/, '//***:***@')}`
    );

    this.pool = new Pool({
      connectionString: DATABASE_URL,
      max: MAX_CONNECTIONS, // Higher connection limit for local
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.stats = {
      totalProcessed: 0,
      totalInserted: 0,
      errors: 0,
      startTime: new Date(),
      importJobId: '',
    };
  }

  getShopDomain(): string {
    // Always use production store for theme settings
    return 'swedia1.myshopify.com';
  }

  async createImportJob(type: DiamondType): Promise<string> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO "ImportJob" (id, type, status, "startedAt", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, 'IN_PROGRESS', NOW(), NOW(), NOW())
         RETURNING id`,
        [type]
      );
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async updateImportJob(
    jobId: string,
    status: 'COMPLETED' | 'FAILED',
    totalRecords?: number,
    processedRecords?: number,
    error?: string
  ) {
    const client = await this.pool.connect();
    try {
      await client.query(
        `UPDATE "ImportJob"
         SET status = $1, "totalRecords" = $2, "processedRecords" = $3,
             "completedAt" = NOW(), "updatedAt" = NOW(), error = $4
         WHERE id = $5`,
        [status, totalRecords, processedRecords, error, jobId]
      );
    } finally {
      client.release();
    }
  }

  async clearExistingDiamonds(type: DiamondType) {
    console.log(`[LOCAL-IMPORT] Clearing existing ${type} diamonds...`);
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM "Diamond" WHERE type = $1',
        [type]
      );
      console.log(
        `[LOCAL-IMPORT] Cleared ${result.rowCount} existing ${type} diamonds`
      );
    } finally {
      client.release();
    }
  }

  async bulkInsertDiamonds(
    diamonds: any[],
    type: DiamondType,
    importJobId: string
  ) {
    if (diamonds.length === 0) return 0;

    console.log(`[LOCAL-IMPORT] Starting bulk insert of ${diamonds.length} ${type} diamonds`);

    const client = await this.pool.connect();
    try {
      // Generate UUIDs for new diamonds
      const diamondsWithIds = diamonds.map((diamond) => {
        const isTypeChanged =
          (diamond as any)._shouldBeLabType && type === 'natural';
        if (isTypeChanged) {
          this.typeChangedCount++;
        }

        return {
          ...diamond,
          id: randomUUID(),
          // Check if this diamond should be marked as lab type (based on LG certificate)
          type: (diamond as any)._shouldBeLabType ? 'lab' : type,
          importJobId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      console.log(`[LOCAL-IMPORT] After ID mapping: ${diamondsWithIds.length} diamonds`);

      // Build the VALUES clause for bulk insert
      const values: any[] = [];
      const placeholders: string[] = [];

      let validDiamondCount = 0;
      let skippedCount = 0;
      
      diamondsWithIds.forEach((diamond, index) => {
        // Validate essential fields
        if (!diamond.itemId) {
          console.warn(`[LOCAL-IMPORT] Skipping diamond ${index}: missing itemId (value: ${diamond.itemId})`);
          skippedCount++;
          return;
        }

        const baseIndex = validDiamondCount * 70; // Use valid diamond count for proper indexing
        placeholders.push(
          `(${Array.from({ length: 70 }, (_, i) => `$${baseIndex + i + 1}`).join(', ')})`
        );
        validDiamondCount++;

        values.push(
          diamond.id || null,
          diamond.itemId || null,
          diamond.supplierStockRef || null,
          diamond.cut || null,
          diamond.carat || null,
          diamond.color || null,
          diamond.naturalFancyColor || null,
          diamond.naturalFancyColorIntensity || null,
          diamond.naturalFancyColorOvertone || null,
          diamond.treatedColor || null,
          diamond.clarity || null,
          diamond.cutGrade || null,
          diamond.gradingLab || null,
          diamond.certificateNumber || null,
          diamond.certificatePath || null,
          diamond.certificateUrl || null,
          diamond.imagePath || null,
          diamond.imageUrl || null,
          diamond.onlineReport || null,
          diamond.onlineReportUrl || null,
          diamond.videoUrl || null,
          diamond.threeDViewerUrl || null,
          diamond.pricePerCarat || null,
          diamond.totalPrice || null,
          diamond.totalPriceSek || null,
          diamond.priceWithMarkupSek || null,
          diamond.finalPriceSek || null,
          diamond.percentOffIdexList || null,
          diamond.polish || null,
          diamond.symmetry || null,
          diamond.measurementsLength || null,
          diamond.measurementsWidth || null,
          diamond.measurementsHeight || null,
          diamond.depthPercent || null,
          diamond.tablePercent || null,
          diamond.crownHeight || null,
          diamond.crownAngle || null,
          diamond.pavilionDepth || null,
          diamond.pavilionAngle || null,
          diamond.girdleFrom || null,
          diamond.girdleTo || null,
          diamond.culetSize || null,
          diamond.culetCondition || null,
          diamond.graining || null,
          diamond.fluorescenceIntensity || null,
          diamond.fluorescenceColor || null,
          diamond.enhancement || null,
          diamond.country || null,
          diamond.countryCode || null,
          diamond.countryName || null,
          diamond.stateRegion || null,
          diamond.stateCode || null,
          diamond.stateName || null,
          diamond.pairStockRef || null,
          diamond.pairSeparable || null,
          diamond.askingPriceForPair || null,
          diamond.askingPricePerCaratForPair || null,
          diamond.shade || null,
          diamond.milky || null,
          diamond.blackInclusion || null,
          diamond.eyeClean || null,
          diamond.provenanceReport || null,
          diamond.provenanceNumber || null,
          diamond.brand || null,
          diamond.guaranteedAvailability || null,
          diamond.availability || null,
          diamond.type || type,
          diamond.createdAt || new Date(),
          diamond.updatedAt || new Date(),
          diamond.importJobId || importJobId
        );
      });

      console.log(`[LOCAL-IMPORT] Processing complete: ${validDiamondCount} valid, ${skippedCount} skipped`);
      console.log(`[LOCAL-IMPORT] Generated ${placeholders.length} placeholders, ${values.length} values`);

      // Ensure we have valid data to insert
      if (placeholders.length === 0 || values.length === 0) {
        console.warn(`[LOCAL-IMPORT] No valid diamonds to insert from batch of ${diamonds.length}`);
        return 0;
      }

      // Validate parameter count matches expectations
      const expectedParams = placeholders.length * 70;
      if (values.length !== expectedParams) {
        console.error(`[LOCAL-IMPORT] Parameter mismatch: expected ${expectedParams}, got ${values.length}`);
        console.error(`[LOCAL-IMPORT] Placeholders: ${placeholders.length}, Values: ${values.length}`);
        return 0;
      }

      const query = `
        INSERT INTO "Diamond" (
          id, "itemId", "supplierStockRef", cut, carat, color, "naturalFancyColor",
          "naturalFancyColorIntensity", "naturalFancyColorOvertone", "treatedColor", clarity,
          "cutGrade", "gradingLab", "certificateNumber", "certificatePath", "certificateUrl",
          "imagePath", "imageUrl", "onlineReport", "onlineReportUrl", "videoUrl", "threeDViewerUrl",
          "pricePerCarat", "totalPrice", "totalPriceSek", "priceWithMarkupSek", "finalPriceSek", "percentOffIdexList", polish, symmetry,
          "measurementsLength", "measurementsWidth", "measurementsHeight", "depthPercent",
          "tablePercent", "crownHeight", "crownAngle", "pavilionDepth", "pavilionAngle",
          "girdleFrom", "girdleTo", "culetSize", "culetCondition", graining,
          "fluorescenceIntensity", "fluorescenceColor", enhancement, country, "countryCode",
          "countryName", "stateRegion", "stateCode", "stateName", "pairStockRef", "pairSeparable",
          "askingPriceForPair", "askingPricePerCaratForPair", shade, milky, "blackInclusion",
          "eyeClean", "provenanceReport", "provenanceNumber", brand, "guaranteedAvailability",
          availability, type, "createdAt", "updatedAt", "importJobId"
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT ("itemId") DO UPDATE SET
          "totalPrice" = EXCLUDED."totalPrice",
          "totalPriceSek" = EXCLUDED."totalPriceSek",
          "priceWithMarkupSek" = EXCLUDED."priceWithMarkupSek",
          "finalPriceSek" = EXCLUDED."finalPriceSek",
          "updatedAt" = EXCLUDED."updatedAt",
          "importJobId" = EXCLUDED."importJobId"
      `;

      // Final validation right before query execution
      console.log(`[LOCAL-IMPORT] Pre-execution check: ${placeholders.length} placeholders, ${values.length} values`);
      console.log(`[LOCAL-IMPORT] Query length: ${query.length} characters`);
      console.log(`[LOCAL-IMPORT] Values sample: ${JSON.stringify(values.slice(0, 5))}...`);
      
      const result = await client.query(query, values);
      return result.rowCount || 0;
    } catch (error) {
      console.error('[LOCAL-IMPORT] Bulk insert error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async importDiamonds(type: DiamondType, limit?: number, retries: number = 3) {
    console.log(
      `[LOCAL-IMPORT] Starting ${type} diamond import${limit ? ` (limit: ${limit})` : ' (full import)'}...`
    );

    // Reset type changed counter for this import
    this.typeChangedCount = 0;

    let attempt = 0;
    while (attempt <= retries) {
      try {
        // Create import job
        this.stats.importJobId = await this.createImportJob(type);
        console.log(
          `[LOCAL-IMPORT] Created import job: ${this.stats.importJobId}`
        );

        // Clear existing diamonds of this type
        await this.clearExistingDiamonds(type);

        // Get shop domain for theme settings
        const shop = this.getShopDomain();
        console.log(
          `[LOCAL-IMPORT] Using shop domain for theme settings: ${shop}`
        );

        // Process diamonds in batches using the streaming API
        let batch: any[] = [];
        let batchCount = 0;
        let totalProcessedThisRun = 0;

        console.log(
          `[LOCAL-IMPORT] Attempting to fetch diamonds (attempt ${attempt + 1}/${retries + 1})...`
        );

        for await (const diamonds of fetchDiamondsStream(type, {
          shop: shop,
          limit: limit, // Limit for local testing
        })) {
          // Add diamonds to current batch
          batch.push(...diamonds);
          this.stats.totalProcessed += diamonds.length;
          totalProcessedThisRun += diamonds.length;

          // Process batch when it reaches the target size
          while (batch.length >= BATCH_SIZE) {
            const currentBatch = batch.splice(0, BATCH_SIZE);
            batchCount++;

            try {
              const inserted = await this.bulkInsertDiamonds(
                currentBatch,
                type,
                this.stats.importJobId
              );
              this.stats.totalInserted += inserted;

              console.log(
                `[LOCAL-IMPORT] Batch ${batchCount}: Inserted ${inserted}/${currentBatch.length} diamonds. ` +
                  `Total: ${this.stats.totalInserted} inserted, ${this.stats.totalProcessed} processed`
              );
            } catch (error) {
              this.stats.errors += currentBatch.length;
              console.error(
                `[LOCAL-IMPORT] Error in batch ${batchCount}:`,
                error
              );
            }
          }

          // Check if we've reached the limit
          if (limit && totalProcessedThisRun >= limit) {
            console.log(
              `[LOCAL-IMPORT] Reached limit of ${limit} diamonds, stopping...`
            );
            break;
          }

          // Less frequent garbage collection due to more memory
          if (batchCount % 20 === 0 && global.gc) {
            global.gc();
          }
        }

        // Process remaining diamonds in final batch
        if (batch.length > 0) {
          batchCount++;
          try {
            const inserted = await this.bulkInsertDiamonds(
              batch,
              type,
              this.stats.importJobId
            );
            this.stats.totalInserted += inserted;
            console.log(
              `[LOCAL-IMPORT] Final batch ${batchCount}: Inserted ${inserted}/${batch.length} diamonds`
            );
          } catch (error) {
            this.stats.errors += batch.length;
            console.error(`[LOCAL-IMPORT] Error in final batch:`, error);
          }
        }

        // Update import job as completed
        await this.updateImportJob(
          this.stats.importJobId,
          'COMPLETED',
          this.stats.totalProcessed,
          this.stats.totalInserted
        );

        this.printSummary(type);
        return; // Success - exit retry loop
      } catch (error) {
        attempt++;
        const isNetworkError =
          error instanceof Error &&
          (error.message.includes('fetch failed') ||
            error.message.includes('ECONNRESET') ||
            error.message.includes('ETIMEDOUT'));

        console.error(
          `[LOCAL-IMPORT] Attempt ${attempt}/${retries + 1} failed:`,
          error
        );

        if (attempt <= retries && isNetworkError) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(
            `[LOCAL-IMPORT] Network error detected. Retrying in ${waitTime / 1000}s...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));

          // Reset stats for retry
          this.stats.totalProcessed = 0;
          this.stats.totalInserted = 0;
          this.stats.errors = 0;
          this.typeChangedCount = 0;
          continue;
        }

        // Final failure - update job and throw
        if (this.stats.importJobId) {
          await this.updateImportJob(
            this.stats.importJobId,
            'FAILED',
            this.stats.totalProcessed,
            this.stats.totalInserted,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }

        throw error;
      }
    }
  }

  printSummary(type: DiamondType) {
    const duration = Date.now() - this.stats.startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    console.log('\n=== LOCAL IMPORT SUMMARY ===');
    console.log(`Diamond Type: ${type}`);
    console.log(`Import Job ID: ${this.stats.importJobId}`);
    console.log(`Batch Size: ${BATCH_SIZE} (5x production size)`);
    console.log(`Max Connections: ${MAX_CONNECTIONS}`);
    console.log(
      `Total Processed: ${this.stats.totalProcessed.toLocaleString()}`
    );
    console.log(`Total Inserted: ${this.stats.totalInserted.toLocaleString()}`);
    console.log(`Errors: ${this.stats.errors.toLocaleString()}`);
    if (type === 'natural' && this.typeChangedCount > 0) {
      console.log(
        `Lab-grown in Natural: ${this.typeChangedCount.toLocaleString()} (moved to lab type)`
      );
    }
    console.log(`Duration: ${minutes}m ${seconds}s`);
    console.log(
      `Rate: ${Math.round(this.stats.totalProcessed / (duration / 1000))} diamonds/sec`
    );
    console.log('============================\n');
  }

  async close() {
    await this.pool.end();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const targetType = args[0] as DiamondType;
  const limitArg = args[1];
  const limit = limitArg ? parseInt(limitArg, 10) : undefined;

  if (targetType && !['natural', 'lab'].includes(targetType)) {
    console.error('Usage: npm run import:local [natural|lab] [limit]');
    console.error('Examples:');
    console.error(
      '  npm run import:local natural 1000  # Import 1000 natural diamonds'
    );
    console.error(
      '  npm run import:local lab            # Import all lab diamonds'
    );
    console.error(
      '  npm run import:local                # Import all diamonds (natural + lab)'
    );
    process.exit(1);
  }

  if (limit && isNaN(limit)) {
    console.error('Limit must be a number');
    process.exit(1);
  }

  const importer = new LocalDiamondImporter();

  try {
    if (targetType) {
      // Import specific type
      await importer.importDiamonds(targetType, limit);
    } else {
      // Import both types
      console.log(
        '[LOCAL-IMPORT] Starting full diamond import (natural + lab)...\n'
      );
      await importer.importDiamonds('natural', limit);
      await importer.importDiamonds('lab', limit);
    }

    console.log('[LOCAL-IMPORT] All imports completed successfully!');
  } catch (error) {
    console.error('[LOCAL-IMPORT] Import failed:', error);
    process.exit(1);
  } finally {
    await importer.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[LOCAL-IMPORT] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[LOCAL-IMPORT] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
