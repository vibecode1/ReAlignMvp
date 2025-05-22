#!/bin/bash

# Use the PG environment variables directly to build a connection string
export DATABASE_URL="postgres://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE?sslmode=require"
echo "Using Neon PostgreSQL connection string for migration"

# Run migration with this connection string
npm run db:push
