#!/bin/bash

# Export database URL using PG environment variables to ensure it's available for this session
export DATABASE_URL="postgres://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE?sslmode=require"
echo "Updated DATABASE_URL to use Neon PostgreSQL for the session"
