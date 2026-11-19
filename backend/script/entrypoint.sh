#!/bin/sh
set -e

echo "Generating Prisma client"
npx prisma generate

echo "Applying database migrations"
# Databases created before migrations existed (by `prisma db push` on the dev branch) have no migration
# history, and Prisma refuses them with P3005. Their tables are exactly 0_init: record it as applied, then
# run the later migrations, which carry data over (a db push to the current schema would drop it instead).
if ! out=$(npx prisma migrate deploy 2>&1); then
  echo "$out"
  case "$out" in
    *P3005*)
      echo "Database has no migration history: baselining it on 0_init"
      npx prisma migrate resolve --applied 0_init
      npx prisma migrate deploy
      ;;
    *)
      echo "Migration failed"
      exit 1
      ;;
  esac
else
  echo "$out"
fi

echo "Starting NestJS"
exec "$@"
