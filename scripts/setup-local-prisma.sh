#!/bin/bash

# Setup Prisma for local database
echo "Setting up Prisma for local development..."

# Export the local DATABASE_URL (using system user authentication)
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/diamond_finder_local"

echo "Running Prisma migrations against local database..."
echo "Database URL: ${DATABASE_URL}"

# Run Prisma migrations
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Local Prisma setup completed successfully!"
else
    echo "❌ Prisma setup failed"
    exit 1
fi