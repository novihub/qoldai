#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

# Seed database only if SEED_DATABASE env var is set to true
if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database..."
  npx prisma db seed
fi

echo "Starting application..."
node dist/main
