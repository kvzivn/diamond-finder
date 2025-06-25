#!/usr/bin/env tsx

import { Pool } from 'pg';
import { fetchDiamondsStream } from '../app/services/idex.service.server.js';
import type { DiamondType } from '../app/models/diamond.server.js';

// Configuration
const DATABASE_URL =
  'postgres://diamond_finder:lWudLMIG7134IEs@localhost:5432/diamond_finder?sslmode=disable';
// const DATABASE_URL = process.env.DATABASE_URL;
const BATCH_SIZE = 500; // Optimized for PostgreSQL performance

interface ImportStats {
  totalProcessed: number;
  totalInserted: number;
  errors: number;
  startTime: Date;
  importJobId: string;
}

class DirectDiamondImporter {
  private pool: Pool;
  private stats: ImportStats;

  constructor() {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.pool = new Pool({
      connectionString: DATABASE_URL,
      max: 5, // Limit connections for import script
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
    console.log(`[IMPORT] Clearing existing ${type} diamonds...`);
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM "Diamond" WHERE type = $1',
        [type]
      );
      console.log(
        `[IMPORT] Cleared ${result.rowCount} existing ${type} diamonds`
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

    const client = await this.pool.connect();
    try {
      // Generate UUIDs for new diamonds
      const diamondsWithIds = diamonds.map((diamond) => ({
        ...diamond,
        id: crypto.randomUUID(),
        type: type,
        importJobId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Build the VALUES clause for bulk insert
      const values: any[] = [];
      const placeholders: string[] = [];

      diamondsWithIds.forEach((diamond, index) => {
        const baseIndex = index * 68; // 68 fields per diamond
        placeholders.push(
          `(${Array.from({ length: 68 }, (_, i) => `$${baseIndex + i + 1}`).join(', ')})`
        );

        values.push(
          diamond.id,
          diamond.itemId,
          diamond.supplierStockRef,
          diamond.cut,
          diamond.carat,
          diamond.color,
          diamond.naturalFancyColor,
          diamond.naturalFancyColorIntensity,
          diamond.naturalFancyColorOvertone,
          diamond.treatedColor,
          diamond.clarity,
          diamond.cutGrade,
          diamond.gradingLab,
          diamond.certificateNumber,
          diamond.certificatePath,
          diamond.certificateUrl,
          diamond.imagePath,
          diamond.imageUrl,
          diamond.onlineReport,
          diamond.onlineReportUrl,
          diamond.videoUrl,
          diamond.threeDViewerUrl,
          diamond.pricePerCarat,
          diamond.totalPrice,
          diamond.totalPriceSek,
          diamond.percentOffIdexList,
          diamond.polish,
          diamond.symmetry,
          diamond.measurementsLength,
          diamond.measurementsWidth,
          diamond.measurementsHeight,
          diamond.depthPercent,
          diamond.tablePercent,
          diamond.crownHeight,
          diamond.crownAngle,
          diamond.pavilionDepth,
          diamond.pavilionAngle,
          diamond.girdleFrom,
          diamond.girdleTo,
          diamond.culetSize,
          diamond.culetCondition,
          diamond.graining,
          diamond.fluorescenceIntensity,
          diamond.fluorescenceColor,
          diamond.enhancement,
          diamond.country,
          diamond.countryCode,
          diamond.countryName,
          diamond.stateRegion,
          diamond.stateCode,
          diamond.stateName,
          diamond.pairStockRef,
          diamond.pairSeparable,
          diamond.askingPriceForPair,
          diamond.askingPricePerCaratForPair,
          diamond.shade,
          diamond.milky,
          diamond.blackInclusion,
          diamond.eyeClean,
          diamond.provenanceReport,
          diamond.provenanceNumber,
          diamond.brand,
          diamond.guaranteedAvailability,
          diamond.availability,
          diamond.type,
          diamond.createdAt,
          diamond.updatedAt,
          diamond.importJobId
        );
      });

      const query = `
        INSERT INTO "Diamond" (
          id, "itemId", "supplierStockRef", cut, carat, color, "naturalFancyColor",
          "naturalFancyColorIntensity", "naturalFancyColorOvertone", "treatedColor", clarity,
          "cutGrade", "gradingLab", "certificateNumber", "certificatePath", "certificateUrl",
          "imagePath", "imageUrl", "onlineReport", "onlineReportUrl", "videoUrl", "threeDViewerUrl",
          "pricePerCarat", "totalPrice", "totalPriceSek", "percentOffIdexList", polish, symmetry,
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
          "updatedAt" = EXCLUDED."updatedAt",
          "importJobId" = EXCLUDED."importJobId"
      `;

      const result = await client.query(query, values);
      return result.rowCount || 0;
    } catch (error) {
      console.error('[IMPORT] Bulk insert error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async importDiamonds(type: DiamondType) {
    console.log(`[IMPORT] Starting ${type} diamond import...`);

    try {
      // Create import job
      this.stats.importJobId = await this.createImportJob(type);
      console.log(`[IMPORT] Created import job: ${this.stats.importJobId}`);

      // Clear existing diamonds of this type
      await this.clearExistingDiamonds(type);

      // Process diamonds in batches using the streaming API
      let batch: any[] = [];
      let batchCount = 0;

      for await (const diamonds of fetchDiamondsStream(type)) {
        // Add diamonds to current batch
        batch.push(...diamonds);
        this.stats.totalProcessed += diamonds.length;

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
              `[IMPORT] Batch ${batchCount}: Inserted ${inserted}/${currentBatch.length} diamonds. ` +
                `Total: ${this.stats.totalInserted} inserted, ${this.stats.totalProcessed} processed`
            );
          } catch (error) {
            this.stats.errors += currentBatch.length;
            console.error(`[IMPORT] Error in batch ${batchCount}:`, error);
          }
        }

        // Memory cleanup hint
        if (batchCount % 10 === 0 && global.gc) {
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
            `[IMPORT] Final batch ${batchCount}: Inserted ${inserted}/${batch.length} diamonds`
          );
        } catch (error) {
          this.stats.errors += batch.length;
          console.error(`[IMPORT] Error in final batch:`, error);
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
    } catch (error) {
      console.error(`[IMPORT] Failed to import ${type} diamonds:`, error);

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

  printSummary(type: DiamondType) {
    const duration = Date.now() - this.stats.startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    console.log('\n=== IMPORT SUMMARY ===');
    console.log(`Diamond Type: ${type}`);
    console.log(`Import Job ID: ${this.stats.importJobId}`);
    console.log(
      `Total Processed: ${this.stats.totalProcessed.toLocaleString()}`
    );
    console.log(`Total Inserted: ${this.stats.totalInserted.toLocaleString()}`);
    console.log(`Errors: ${this.stats.errors.toLocaleString()}`);
    console.log(`Duration: ${minutes}m ${seconds}s`);
    console.log(
      `Rate: ${Math.round(this.stats.totalProcessed / (duration / 1000))} diamonds/sec`
    );
    console.log('=====================\n');
  }

  async close() {
    await this.pool.end();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const targetType = args[0] as DiamondType;

  if (targetType && !['natural', 'lab'].includes(targetType)) {
    console.error('Usage: npm run import:all [natural|lab]');
    process.exit(1);
  }

  const importer = new DirectDiamondImporter();

  try {
    if (targetType) {
      // Import specific type
      await importer.importDiamonds(targetType);
    } else {
      // Import both types
      console.log('[IMPORT] Starting full diamond import (natural + lab)...\n');
      await importer.importDiamonds('natural');
      await importer.importDiamonds('lab');
    }

    console.log('[IMPORT] All imports completed successfully!');
  } catch (error) {
    console.error('[IMPORT] Import failed:', error);
    process.exit(1);
  } finally {
    await importer.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[IMPORT] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[IMPORT] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
