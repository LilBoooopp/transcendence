#!/bin/sh
set -e

echo "Running Prisma setup..."
echo "Generating Prisma client"
npx prisma generate
echo "Database migrations"
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "Prisma setup complete"
else
  echo "Migration failed"
  exit 1
fi

echo "Starting NestJS"
exec "$@"
