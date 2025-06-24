# PostgreSQL Migration Guide

This guide documents the migration from SQLite with in-memory caching to PostgreSQL for production deployment on Fly.io.

## Overview

The migration involves:

1. Changing the database from SQLite to PostgreSQL
2. Moving diamond data from in-memory cache to database storage
3. Adding job tracking for imports
4. Storing exchange rates in the database

## Migration Steps

### 1. Prerequisites

Ensure you have PostgreSQL installed locally or have access to a PostgreSQL database. The `DATABASE_URL` should be set in your `.env` file:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### 2. Apply Database Migration

Run the Prisma migration to create the new tables:

```bash
# For development (local database)
npx prisma migrate dev

# For production (be careful!)
npx prisma migrate deploy
```

### 3. Generate Prisma Client

Generate the updated Prisma client:

```bash
npx prisma generate
```

### 4. Initial Data Import

Trigger the initial diamond data import:

```bash
# Using curl
curl -X POST http://localhost:3000/admin/trigger-refresh

# Or using the Shopify app admin interface
```

## Architecture Changes

### Before (In-Memory Cache)

- Diamond data stored in memory with 2-hour expiration
- Data lost on server restart
- Limited by server memory
- No persistence between deployments

### After (PostgreSQL Database)

- Diamond data persisted in PostgreSQL
- Survives server restarts
- Can handle millions of records
- Proper job tracking for imports
- Exchange rates stored and reused

## New Database Schema

### Diamond Model

- Stores all diamond attributes
- Indexed for efficient filtering
- Supports both natural and lab-grown diamonds

### ImportJob Model

- Tracks import progress
- Records errors for debugging
- Provides import history

### ExchangeRate Model

- Caches exchange rates
- Reduces API calls
- Historical rate tracking

## API Changes

### Routes Updated

- `/diamonds/all` - Now queries database with efficient filtering
- `/diamonds/natural` - Direct database queries with pagination
- `/diamonds/lab` - Direct database queries with pagination
- `/admin/trigger-refresh` - Triggers database import

### Deprecated Services

- `diamond-cache.server.ts` - Replaced by `diamond-db.server.ts`

## Performance Considerations

### Database Indexes

The following indexes are created for optimal query performance:

- Single column indexes: type, cut, totalPrice, carat, color, clarity
- Composite indexes for common filter combinations
- Unique index on itemId to prevent duplicates

### Batch Processing

- Imports process diamonds in batches of 1000 records
- Prevents memory overflow
- Provides progress tracking

## Monitoring

### Import Jobs

Check import job status:

```sql
SELECT * FROM "ImportJob" ORDER BY "createdAt" DESC LIMIT 10;
```

### Diamond Count

Verify diamond counts:

```sql
SELECT type, COUNT(*) FROM "Diamond" GROUP BY type;
```

### Exchange Rates

Check current exchange rates:

```sql
SELECT * FROM "ExchangeRate" WHERE "validUntil" IS NULL;
```

## Rollback Plan

If you need to rollback:

1. Keep the old cache-based code available
2. Update routes to use cache services
3. Deploy the previous version

## Fly.io Deployment

### Database Setup

1. Create a PostgreSQL database on Fly.io:

   ```bash
   fly postgres create
   ```

2. Attach it to your app:

   ```bash
   fly postgres attach --app your-app-name
   ```

3. The `DATABASE_URL` will be automatically set

### Deploy

```bash
fly deploy
```

### Post-Deployment

1. Run migrations:

   ```bash
   fly ssh console -C "npx prisma migrate deploy"
   ```

2. Trigger initial import:
   ```bash
   curl -X POST https://your-app.fly.dev/admin/trigger-refresh
   ```

## Troubleshooting

### Connection Issues

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Ensure network connectivity

### Import Failures

- Check ImportJob error messages
- Verify IDEX API credentials
- Check exchange rate API key

### Performance Issues

- Run `ANALYZE` on tables
- Check query performance with `EXPLAIN`
- Verify indexes are being used

## Future Enhancements

1. Add background job processing with BullMQ
2. Implement incremental updates instead of full refresh
3. Add caching layer (Redis) for frequently accessed data
4. Set up database replication for high availability
