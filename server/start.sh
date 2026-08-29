#!/bin/sh
set -e

echo "Running database migrations..."
npm run typeorm:run-migrations

echo "Starting server..."
exec node dist/main.js