#!/usr/bin/env tsx

import { Pool } from 'pg';

const DATABASE_URL =
  'postgres://diamond_finder:lWudLMIG7134IEs@localhost:5432/diamond_finder?sslmode=disable';
// const DATABASE_URL = process.env.DATABASE_URL;

async function checkImportStatus() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 1,
  });

  try {
    console.log('🔗 Testing database connection...');

    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();

    // Get database info
    const dbInfo = await pool.query(`
      SELECT
        COUNT(*) as total_diamonds,
        COUNT(*) FILTER (WHERE type = 'natural') as natural_diamonds,
        COUNT(*) FILTER (WHERE type = 'lab') as lab_diamonds,
        MAX("updatedAt") as last_updated
      FROM "Diamond"
    `);

    console.log('\n📊 Diamond Database Status:');
    console.log(
      `Total Diamonds: ${Number(dbInfo.rows[0].total_diamonds).toLocaleString()}`
    );
    console.log(
      `Natural Diamonds: ${Number(dbInfo.rows[0].natural_diamonds).toLocaleString()}`
    );
    console.log(
      `Lab Diamonds: ${Number(dbInfo.rows[0].lab_diamonds).toLocaleString()}`
    );
    console.log(`Last Updated: ${dbInfo.rows[0].last_updated || 'Never'}`);

    // Get recent import jobs
    const importJobs = await pool.query(`
      SELECT
        id,
        type,
        status,
        "totalRecords",
        "processedRecords",
        "startedAt",
        "completedAt",
        error,
        "createdAt"
      FROM "ImportJob"
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);

    console.log('\n📋 Recent Import Jobs:');
    if (importJobs.rows.length === 0) {
      console.log('No import jobs found');
    } else {
      console.log(
        '┌─────────────────┬─────────┬─────────────┬──────────────┬─────────────────────┐'
      );
      console.log(
        '│ Type            │ Status  │ Records     │ Processed    │ Started             │'
      );
      console.log(
        '├─────────────────┼─────────┼─────────────┼──────────────┼─────────────────────┤'
      );

      importJobs.rows.forEach((job) => {
        const type = job.type.padEnd(15);
        const status = job.status.padEnd(7);
        const total = (job.totalRecords || 0).toLocaleString().padEnd(11);
        const processed = (job.processedRecords || 0)
          .toLocaleString()
          .padEnd(12);
        const started = job.startedAt
          ? new Date(job.startedAt).toLocaleString()
          : 'Not started';

        console.log(
          `│ ${type} │ ${status} │ ${total} │ ${processed} │ ${started} │`
        );

        if (job.error) {
          console.log(
            `│ Error: ${job.error.substring(0, 60)}${job.error.length > 60 ? '...' : ''}`
          );
        }
      });

      console.log(
        '└─────────────────┴─────────┴─────────────┴──────────────┴─────────────────────┘'
      );
    }

    // Check for failed jobs
    const failedJobs = await pool.query(`
      SELECT COUNT(*) as failed_count
      FROM "ImportJob"
      WHERE status = 'FAILED'
    `);

    if (Number(failedJobs.rows[0].failed_count) > 0) {
      console.log(
        `\n⚠️  Warning: ${failedJobs.rows[0].failed_count} failed import jobs detected`
      );
    }

    // Check exchange rates
    const exchangeRates = await pool.query(`
      SELECT
        "fromCurrency",
        "toCurrency",
        rate,
        "validFrom"
      FROM "ExchangeRate"
      ORDER BY "validFrom" DESC
      LIMIT 5
    `);

    console.log('\n💱 Recent Exchange Rates:');
    if (exchangeRates.rows.length === 0) {
      console.log('No exchange rates found');
    } else {
      exchangeRates.rows.forEach((rate) => {
        console.log(
          `${rate.fromCurrency} → ${rate.toCurrency}: ${rate.rate} (${new Date(rate.validFrom).toLocaleString()})`
        );
      });
    }
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  checkImportStatus();
}
