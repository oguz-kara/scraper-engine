import { Injectable, Logger } from '@nestjs/common'
import { ScrapedItem, ScrapedItemInput, BatchResult } from '../interfaces/scraped-item.interface'
import { Prisma, ScrapingProvider } from '@prisma/client'
import { PrismaService } from 'src/common/database/prisma.service'

@Injectable()
export class ScrapedItemRepository {
  private readonly logger = new Logger(ScrapedItemRepository.name)

  constructor(private prisma: PrismaService) {}

  async create(data: ScrapedItemInput): Promise<ScrapedItem> {
    try {
      const item = await this.prisma.scrapedItem.create({
        data: {
          jobId: data.jobId,
          provider: data.provider as ScrapingProvider,
          deduplicationKey: this.generateDeduplicationKey(data),
          rawHtml: data.rawHtml,
          rawData: data.rawHtml,
          normalizedData: data.normalizedData as Prisma.InputJsonValue,
          metadata: data.metadata as Prisma.InputJsonValue,
          scrapedAt: new Date(),
        },
      })

      return this.mapPrismaToInterface(item)
    } catch (error) {
      this.logger.error(`Error creating scraped item for job ${data.jobId}:`, error)
      throw error
    }
  }

  async createMany(items: ScrapedItemInput[]): Promise<BatchResult> {
    const errors: Array<{ item: ScrapedItemInput; error: string }> = []
    let processedCount = 0
    let duplicateCount = 0

    try {
      // Process items in smaller batches to avoid transaction limits
      const batchSize = 100
      const batches = this.chunkArray(items, batchSize)

      for (const batch of batches) {
        try {
          const batchData = batch.map(item => ({
            jobId: item.jobId,
            provider: item.provider as ScrapingProvider,
            deduplicationKey: this.generateDeduplicationKey(item),
            rawHtml: item.rawHtml,
            rawData: item.rawHtml,
            normalizedData: item.normalizedData as Prisma.InputJsonValue,
            sourceUrl: item.sourceUrl,
            metadata: item.metadata as Prisma.InputJsonValue,
            scrapedAt: new Date(),
          }))

          // Use createMany with skipDuplicates for performance
          const result = await this.prisma.scrapedItem.createMany({
            data: batchData,
            skipDuplicates: true,
          })

          processedCount += result.count
          duplicateCount += batch.length - result.count
        } catch (batchError) {
          this.logger.error('Error processing batch:', batchError)
          // Add all items in this batch to errors
          batch.forEach(item => {
            errors.push({
              item,
              error: batchError.message || 'Batch processing failed',
            })
          })
        }
      }

      this.logger.log(
        `Batch create completed: ${processedCount} stored, ${duplicateCount} duplicates, ${errors.length} errors`,
      )

      return {
        processedCount,
        duplicateCount,
        errorCount: errors.length,
        errors,
      }
    } catch (error) {
      this.logger.error('Error in batch create:', error)
      throw error
    }
  }

  async findByDeduplicationKey(key: string): Promise<ScrapedItem | null> {
    try {
      const item = await this.prisma.scrapedItem.findUnique({
        where: { deduplicationKey_provider: { deduplicationKey: key, provider: 'SHELL' } },
      })

      return item ? this.mapPrismaToInterface(item) : null
    } catch (error) {
      this.logger.error(`Error finding item by deduplication key ${key}:`, error)
      throw error
    }
  }

  async findByJobId(jobId: string, limit = 100, offset = 0): Promise<ScrapedItem[]> {
    try {
      const items = await this.prisma.scrapedItem.findMany({
        where: { jobId },
        orderBy: { scrapedAt: 'desc' },
        take: limit,
        skip: offset,
      })

      return items.map(item => this.mapPrismaToInterface(item))
    } catch (error) {
      this.logger.error(`Error finding items for job ${jobId}:`, error)
      throw error
    }
  }

  async countByJobId(jobId: string): Promise<number> {
    try {
      return await this.prisma.scrapedItem.count({
        where: { jobId },
      })
    } catch (error) {
      this.logger.error(`Error counting items for job ${jobId}:`, error)
      throw error
    }
  }

  async deleteByJobId(jobId: string): Promise<number> {
    try {
      const result = await this.prisma.scrapedItem.deleteMany({
        where: { jobId },
      })

      this.logger.log(`Deleted ${result.count} items for job ${jobId}`)
      return result.count
    } catch (error) {
      this.logger.error(`Error deleting items for job ${jobId}:`, error)
      throw error
    }
  }

  async getJobStats(jobId: string): Promise<{
    totalItems: number
    latestItem?: ScrapedItem
    oldestItem?: ScrapedItem
  }> {
    try {
      const [totalItems, latestItem, oldestItem] = await Promise.all([
        this.prisma.scrapedItem.count({ where: { jobId } }),
        this.prisma.scrapedItem.findFirst({
          where: { jobId },
          orderBy: { scrapedAt: 'desc' },
        }),
        this.prisma.scrapedItem.findFirst({
          where: { jobId },
          orderBy: { scrapedAt: 'asc' },
        }),
      ])

      return {
        totalItems,
        latestItem: latestItem ? this.mapPrismaToInterface(latestItem) : undefined,
        oldestItem: oldestItem ? this.mapPrismaToInterface(oldestItem) : undefined,
      }
    } catch (error) {
      this.logger.error(`Error getting stats for job ${jobId}:`, error)
      throw error
    }
  }

  private generateDeduplicationKey(item: ScrapedItemInput): string {
    // This will be enhanced by the deduplication service
    // For now, use a simple approach
    const keyParts = [item.jobId, item.sourceUrl || 'no-url']

    // Add normalized data hash if available
    if (item.normalizedData) {
      const dataHash = this.hashObject(item.normalizedData)
      keyParts.push(dataHash)
    }

    return keyParts.join('::')
  }

  private hashObject(obj: Record<string, any>): string {
    // Simple hash function for objects
    const str = JSON.stringify(obj, Object.keys(obj).sort())
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private mapPrismaToInterface(item: any): ScrapedItem {
    return {
      id: item.id,
      jobId: item.jobId,
      provider: item.job?.provider || 'unknown',
      deduplicationKey: item.deduplicationKey,
      rawHtml: item.rawHtml,
      normalizedData: item.normalizedData as Record<string, any>,
      sourceUrl: item.sourceUrl,
      scrapedAt: item.scrapedAt,
      metadata: item.metadata as Record<string, any>,
    }
  }
}
