ALTER TABLE "User" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- deleteUser has always set this marker; a bcrypt hash can never equal it.
UPDATE "User" SET "isDeleted" = true WHERE "password" = '[DELETED]';
