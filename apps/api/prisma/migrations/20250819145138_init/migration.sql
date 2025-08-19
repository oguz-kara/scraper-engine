-- CreateEnum
CREATE TYPE "ScrapingProvider" AS ENUM ('SHELL', 'CASTROL', 'GOOGLE', 'LINKEDIN');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "ScrapingJob" (
    "id" TEXT NOT NULL,
    "provider" "ScrapingProvider" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "configuration" JSONB NOT NULL,
    "input" JSONB,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkpoint" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "state" JSONB NOT NULL,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "currentPage" INTEGER,
    "lastItemId" TEXT,
    "browserState" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapedItem" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "provider" "ScrapingProvider" NOT NULL,
    "deduplicationKey" TEXT NOT NULL,
    "rawHtml" TEXT,
    "rawData" JSONB NOT NULL,
    "normalizedData" JSONB NOT NULL,
    "metadata" JSONB,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapingLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "error" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapingConfiguration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "ScrapingProvider" NOT NULL,
    "selectors" JSONB NOT NULL,
    "options" JSONB NOT NULL,
    "headers" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapingConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScrapingJob_status_provider_idx" ON "ScrapingJob"("status", "provider");

-- CreateIndex
CREATE INDEX "ScrapingJob_createdAt_idx" ON "ScrapingJob"("createdAt");

-- CreateIndex
CREATE INDEX "Checkpoint_jobId_createdAt_idx" ON "Checkpoint"("jobId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Checkpoint_jobId_sequenceNumber_key" ON "Checkpoint"("jobId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "ScrapedItem_jobId_idx" ON "ScrapedItem"("jobId");

-- CreateIndex
CREATE INDEX "ScrapedItem_provider_createdAt_idx" ON "ScrapedItem"("provider", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScrapedItem_deduplicationKey_provider_key" ON "ScrapedItem"("deduplicationKey", "provider");

-- CreateIndex
CREATE INDEX "ScrapingLog_jobId_level_idx" ON "ScrapingLog"("jobId", "level");

-- CreateIndex
CREATE INDEX "ScrapingLog_createdAt_idx" ON "ScrapingLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScrapingConfiguration_name_key" ON "ScrapingConfiguration"("name");

-- CreateIndex
CREATE INDEX "ScrapingConfiguration_provider_active_idx" ON "ScrapingConfiguration"("provider", "active");

-- AddForeignKey
ALTER TABLE "Checkpoint" ADD CONSTRAINT "Checkpoint_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ScrapingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapedItem" ADD CONSTRAINT "ScrapedItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ScrapingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapingLog" ADD CONSTRAINT "ScrapingLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ScrapingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
