/*
  Warnings:

  - You are about to drop the column `metadata` on the `ScrapingJob` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `ScrapingJob` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ScrapingJob` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ScrapingJob_status_provider_idx";

-- AlterTable
ALTER TABLE "ScrapingJob" DROP COLUMN "metadata",
DROP COLUMN "priority",
DROP COLUMN "updatedAt",
ADD COLUMN     "currentInput" JSONB,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "itemsPerSecond" DOUBLE PRECISION,
ADD COLUMN     "itemsScraped" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastRetryAt" TIMESTAMP(3),
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "processedInput" JSONB,
ADD COLUMN     "progressPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "remainingInput" JSONB,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "configuration" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ScrapingJob_provider_status_idx" ON "ScrapingJob"("provider", "status");
