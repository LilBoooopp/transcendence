#!/bin/sh
set -e

echo "Generating Prisma client"
npx prisma generate

echo "Applying database migrations"
# Databases created before migrations existed (by `prisma db push`) have no migration history, and
# Prisma refuses them with P3005. Bring them up to the current schema once (db push still refuses
# anything that would drop data), record 0_init as applied, then migrate as usual.
if ! out=$(npx prisma migrate deploy 2>&1); then
  echo "$out"
  case "$out" in
    *P3005*)
      echo "Database has no migration history: baselining it on 0_init"
      npx prisma db push --skip-generate
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
