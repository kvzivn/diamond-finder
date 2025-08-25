#!/bin/bash

# Setup local PostgreSQL database for diamond-finder
echo "Setting up local PostgreSQL database..."

# Database configuration
DB_NAME="diamond_finder_local"
DB_USER=$(whoami)
DB_PASSWORD=""
DB_PORT="5433"

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "PostgreSQL is not running. Please start PostgreSQL first:"
    echo "  brew services start postgresql"
    echo "  # or"
    echo "  pg_ctl -D /usr/local/var/postgres start"
    exit 1
fi

# Create database user if it doesn't exist (skip if using current user)
echo "Database user: $DB_USER (using current system user)"

# Create database if it doesn't exist
echo "Creating database..."
psql -h localhost -p 5432 -U $(whoami) -d postgres -c "
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
" 2>/dev/null || true

echo "Database $DB_NAME created (or already exists)"

echo "Local database setup complete!"
echo ""
echo "Database Details:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: (none - using system authentication)"
echo ""
echo "Connection URL:"
echo "  postgresql://$DB_USER@localhost:5432/$DB_NAME"
echo ""
echo "Next steps:"
echo "  1. Create a .env.local file with the local DATABASE_URL"
echo "  2. Run: npm run setup:local (to run migrations on local DB)"
echo "  3. Run: npm run import:local (to import diamonds to local DB)"