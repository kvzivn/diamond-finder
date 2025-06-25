# Diamond Import Scripts

This directory contains scripts for importing diamond data directly into PostgreSQL.

## Direct PostgreSQL Import (`import-diamonds-direct.ts`)

A high-performance script that bypasses the Remix app server and writes diamond data directly to PostgreSQL using bulk insert operations.

### Features

- **Direct PostgreSQL Connection**: Uses `pg` client for maximum performance
- **Bulk Insert Operations**: Processes diamonds in optimized batches (500 per batch)
- **Memory Efficient**: Streams data and includes garbage collection hints
- **Progress Tracking**: Creates and updates ImportJob records
- **Error Handling**: Comprehensive error handling with graceful recovery
- **Conflict Resolution**: Handles duplicate `itemId` with UPSERT logic
- **Type Safety**: Full TypeScript support with existing diamond models

### Prerequisites

```bash
# Install required dependencies
npm install
```

### Usage

#### Command Line Interface

```bash
# Import all diamonds (natural + lab grown)
npm run import:all

# Import only natural diamonds
npm run import:natural

# Import only lab grown diamonds
npm run import:lab

# Check import status and database info
npm run import:status
```

#### Admin Web Interface

Navigate to `/admin/trigger-import` in your Shopify app to:

- View current database status and diamond counts
- Trigger imports via web interface
- Monitor recent import job history
- Check import progress in real-time

### Environment Variables

Required:

- `DATABASE_URL`: PostgreSQL connection string
- `IDEX_API_KEY`: IDEX API key
- `IDEX_API_SECRET`: IDEX API secret
- `EXCHANGE_RATE_APP_ID`: Open Exchange Rates API key

### Performance

- **Batch Size**: 500 diamonds per insert (optimized for PostgreSQL)
- **Connection Pool**: Limited to 5 connections for import operations
- **Memory Management**: Automatic garbage collection hints every 10 batches
- **Expected Rate**: ~500-1000 diamonds/second depending on server specs

### Import Process

1. **Create Import Job**: Creates a tracked job in the `ImportJob` table
2. **Clear Existing Data**: Removes existing diamonds of the target type
3. **Stream & Process**: Uses existing `fetchDiamondsStream` for memory efficiency
4. **Bulk Insert**: Inserts diamonds in optimized batches
5. **Track Progress**: Updates import job with progress and completion status
6. **Summary Report**: Displays detailed import statistics

### Database Operations

- **Conflict Resolution**: Uses `ON CONFLICT (itemId) DO UPDATE` for upserts
- **Transaction Safety**: Each batch insert is atomic
- **Index Optimization**: Leverages existing database indexes for performance
- **Foreign Key Handling**: Properly links diamonds to import jobs

### Monitoring

Import progress is logged in real-time:

```
[IMPORT] Starting natural diamond import...
[IMPORT] Created import job: abc123...
[IMPORT] Cleared 45000 existing natural diamonds
[IMPORT] Batch 1: Inserted 500/500 diamonds. Total: 500 inserted, 800 processed
[IMPORT] Batch 2: Inserted 500/500 diamonds. Total: 1000 inserted, 1600 processed
...
=== IMPORT SUMMARY ===
Diamond Type: natural
Import Job ID: abc123...
Total Processed: 50,000
Total Inserted: 49,950
Errors: 50
Duration: 2m 30s
Rate: 333 diamonds/sec
=====================
```

### Error Handling

- **Batch-level isolation**: Errors in one batch don't affect others
- **Import job tracking**: Failed jobs are marked with error details
- **Graceful shutdown**: Handles SIGINT/SIGTERM for clean exits
- **Detailed logging**: Error context and stack traces for debugging

### Troubleshooting

**Connection Issues:**

- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Check network connectivity to database
- Ensure database accepts connections from your IP

**API Issues:**

- Verify IDEX API credentials
- Check API rate limits and quotas
- Ensure exchange rate API is accessible

**Memory Issues:**

- Monitor system memory during large imports
- Adjust `BATCH_SIZE` if experiencing OOM errors
- Ensure sufficient swap space available

**Performance Tuning:**

- Consider temporarily disabling non-unique indexes during import
- Adjust PostgreSQL settings for bulk operations
- Run during low-traffic periods for best performance
