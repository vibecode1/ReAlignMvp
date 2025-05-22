#!/bin/bash

# Create proper database URL from environment variables with SSL required
export DATABASE_URL="postgres://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE?sslmode=require"
echo "Updated DATABASE_URL to use Neon PostgreSQL with SSL required"
