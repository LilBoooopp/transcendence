-- Games <-> users become many to many through "GamePlayer" (one row per seat).
-- Order matters: create the join table, copy every existing seat into it, only then drop the old columns.

-- CreateEnum
CREATE TYPE "PlayerColor" AS ENUM ('WHITE', 'BLACK');

-- CreateTable
CREATE TABLE "GamePlayer" (
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "color" "PlayerColor" NOT NULL,

    CONSTRAINT "GamePlayer_pkey" PRIMARY KEY ("gameId","color")
);

-- CreateIndex
CREATE INDEX "GamePlayer_userId_idx" ON "GamePlayer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GamePlayer_gameId_userId_key" ON "GamePlayer"("gameId", "userId");

-- AddForeignKey
ALTER TABLE "GamePlayer" ADD CONSTRAINT "GamePlayer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayer" ADD CONSTRAINT "GamePlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copy existing seats (a user found on both sides of one game keeps the white seat only).
INSERT INTO "GamePlayer" ("gameId", "userId", "color")
SELECT "id", "whitePlayerId", 'WHITE' FROM "Game" WHERE "whitePlayerId" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "GamePlayer" ("gameId", "userId", "color")
SELECT "id", "blackPlayerId", 'BLACK' FROM "Game" WHERE "blackPlayerId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_whitePlayerId_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_blackPlayerId_fkey";

-- DropIndex
DROP INDEX "Game_whitePlayerId_idx";

-- DropIndex
DROP INDEX "Game_blackPlayerId_idx";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "blackPlayerId",
DROP COLUMN "whitePlayerId";
