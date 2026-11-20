ALTER TABLE "User" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "isDeleted" = true
WHERE "password" = '[DELETED]'
   OR ("username" LIKE 'deleted-%' AND "email" LIKE 'deleted-%@deleted.invalid');
