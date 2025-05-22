#!/bin/bash

# Create proper database URL from environment variables with SSL required
NEW_DB_URL="postgres://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE?sslmode=require"
echo "Setting DATABASE_URL with SSL required..."

# Run the migration with the correct DATABASE_URL
DATABASE_URL="$NEW_DB_URL" npm run db:push
