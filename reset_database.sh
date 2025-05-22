#!/bin/bash

# Extract database connection details from environment
DB_USER=$PGUSER
DB_PASSWORD=$PGPASSWORD
DB_HOST=$PGHOST
DB_PORT=$PGPORT
DB_NAME=$PGDATABASE

echo "Connecting to PostgreSQL database to reset users..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "TRUNCATE users CASCADE;"

echo "Database reset completed."
