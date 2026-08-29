#!/bin/sh
set -e

# echo "🔍 Running database migrations with increased memory limit..."
# NODE_OPTIONS="--max-old-space-size=512" npm run typeorm:run-migrations

echo "🚀 Starting server..."
exec node dist/main.js