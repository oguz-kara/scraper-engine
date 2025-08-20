import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { ConfigService } from '@nestjs/config'
import { ScrapedItemInput, ProcessorStats, BatchResult } from '../interfaces/scraped-item.interface'
import { ProcessorConfig } from '../interfaces/processor-config.interface'
import type {
  ScraperItemFoundEvent,
  DataProcessorBatchEvent,
  DataProcessorErrorEvent,
  DataProcessorStatsEvent,
} from '../events/processor.events'
import { SCRAPER_EVENTS, DATA_PROCESSOR_EVENTS } from '../events/processor.events'
import { ScrapedItemRepository } from '../repositories/scraped-item.repository'
import { DeduplicationService } from './deduplication.service'
import { TransformationService } from './transformation.service'

@Injectable()
export class DataProcessorService implements OnModuleInit {
  private readonly logger = new Logger(DataProcessorService.name)
  private processorConfig: ProcessorConfig
  private batchBuffer = new Map<string, ScrapedItemInput[]>()
  private batchTimers = new Map<string, NodeJS.Timeout>()
  private processorStats = new Map<string, ProcessorStats>()

  constructor(
    private eventEmitter: EventEmitter2,
    private configService: ConfigService,
    private scrapedItemRepository: ScrapedItemRepository,
    private deduplicationService: DeduplicationService,
    private transformationService: TransformationService,
  ) {
    this.processorConfig = this.loadProcessorConfig()
  }

  onModuleInit() {
    this.logger.log('Data Processor Service initialized')
    this.logger.log(`Processor config: ${JSON.stringify(this.processorConfig)}`)
  }

  @OnEvent(SCRAPER_EVENTS.ITEM_FOUND)
  async handleItemFound(event: ScraperItemFoundEvent): Promise<void> {
    try {
      this.logger.debug(`Processing scraped item for job ${event.jobId}`)

      const scrapedItem: ScrapedItemInput = {
        jobId: event.jobId,
        provider: event.provider,
        rawHtml: event.item.rawHtml || '',
        normalizedData: event.item,
        sourceUrl: event.sourceUrl,
        metadata: {
          ...event.metadata,
          provider: event.provider,
          scrapedAt: event.timestamp,
        },
      }

      // Add to batch buffer
      await this.addToBatch(scrapedItem)
    } catch (error) {
      this.logger.error(`Error handling item found event for job ${event.jobId}:`, error)
      this.emitErrorEvent(event.jobId, event.provider, error.message, 'processing', event.item)
    }
  }

  private async addToBatch(item: ScrapedItemInput): Promise<void> {
    const batchKey = `${item.jobId}::${item.provider}`

    // Initialize batch buffer if not exists
    if (!this.batchBuffer.has(batchKey)) {
      this.batchBuffer.set(batchKey, [])
    }

    // Add item to batch
    this.batchBuffer.get(batchKey)!.push(item)

    // Check if batch is ready for processing
    const currentBatch = this.batchBuffer.get(batchKey)!
    if (currentBatch.length >= this.processorConfig.batchSize) {
      await this.processBatch(batchKey)
    } else {
      // Set or reset batch timeout
      this.setBatchTimeout(batchKey)
    }
  }

  private setBatchTimeout(batchKey: string): void {
    // Clear existing timeout
    if (this.batchTimers.has(batchKey)) {
      clearTimeout(this.batchTimers.get(batchKey))
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.processBatch(batchKey).catch(error => {
        this.logger.error(`Error in batch timeout for ${batchKey}:`, error)
      })
    }, this.processorConfig.batchTimeoutMs)

    this.batchTimers.set(batchKey, timeout)
  }

  private async processBatch(batchKey: string): Promise<void> {
    try {
      const batch = this.batchBuffer.get(batchKey)
      if (!batch || batch.length === 0) {
        return
      }

      this.logger.log(`Processing batch for ${batchKey} with ${batch.length} items`)

      // Clear batch buffer and timer
      this.batchBuffer.set(batchKey, [])
      if (this.batchTimers.has(batchKey)) {
        clearTimeout(this.batchTimers.get(batchKey))
        this.batchTimers.delete(batchKey)
      }

      const [jobId, provider] = batchKey.split('::')

      // Step 1: Deduplication
      let uniqueItems = batch
      let duplicateCount = 0

      if (this.processorConfig.enableDeduplication) {
        const deduplicationResult = await this.deduplicationService.batchCheckDuplicates(batch)
        uniqueItems = deduplicationResult.uniqueItems
        duplicateCount = deduplicationResult.duplicates.length

        this.logger.debug(`Deduplication: ${uniqueItems.length} unique, ${duplicateCount} duplicates`)

        // Emit events for duplicates
        deduplicationResult.duplicates.forEach(duplicate => {
          this.eventEmitter.emit(DATA_PROCESSOR_EVENTS.DUPLICATE_SKIPPED, {
            jobId,
            provider,
            item: duplicate.item,
            deduplicationKey: duplicate.deduplicationKey,
            timestamp: new Date(),
          })
        })
      }

      // Step 2: Transformation
      let transformedItems = uniqueItems
      let transformationErrors = 0

      if (this.processorConfig.enableTransformation) {
        const transformationResult = await this.transformationService.batchTransform(uniqueItems)

        // Use transformed data
        transformedItems = transformationResult.successfulTransformations.map(t => ({
          ...t.item,
          normalizedData: t.transformedData,
        }))

        transformationErrors = transformationResult.failedTransformations.length

        this.logger.debug(`Transformation: ${transformedItems.length} successful, ${transformationErrors} errors`)

        // Emit events for transformation errors
        transformationResult.failedTransformations.forEach(failed => {
          this.emitErrorEvent(jobId, provider, failed.errors.join(', '), 'transformation', failed.item)
        })
      }

      // Step 3: Storage
      let batchResult: BatchResult
      if (transformedItems.length > 0) {
        batchResult = await this.scrapedItemRepository.createMany(transformedItems)
      } else {
        batchResult = {
          processedCount: 0,
          duplicateCount: 0,
          errorCount: 0,
          errors: [],
        }
      }

      // Update stats
      await this.updateStats(jobId, provider, {
        processedItems: batch.length,
        duplicatesSkipped: duplicateCount,
        itemsStored: batchResult.processedCount,
        transformationErrors,
        storageErrors: batchResult.errorCount,
      })

      // Emit batch processed event
      this.eventEmitter.emit(DATA_PROCESSOR_EVENTS.BATCH_PROCESSED, {
        jobId,
        provider,
        batchSize: batch.length,
        duplicatesSkipped: duplicateCount,
        itemsStored: batchResult.processedCount,
        errors: transformationErrors + batchResult.errorCount,
        timestamp: new Date(),
      } as DataProcessorBatchEvent)

      this.logger.log(
        `Batch processed for ${batchKey}: ${batchResult.processedCount} stored, ${duplicateCount} duplicates, ${transformationErrors + batchResult.errorCount} errors`,
      )
    } catch (error) {
      this.logger.error(`Error processing batch for ${batchKey}:`, error)

      const [jobId, provider] = batchKey.split('::')
      this.emitErrorEvent(jobId, provider, error.message, 'storage')
    }
  }

  async processItemDirectly(item: ScrapedItemInput): Promise<{
    success: boolean
    stored: boolean
    duplicate: boolean
    errors: string[]
  }> {
    try {
      this.logger.debug(`Processing item directly for job ${item.jobId}`)

      // Deduplication check
      let isDuplicate = false
      if (this.processorConfig.enableDeduplication) {
        const deduplicationResult = await this.deduplicationService.checkDuplicate(item)
        isDuplicate = deduplicationResult.isDuplicate

        if (isDuplicate) {
          this.logger.debug(`Item is duplicate: ${deduplicationResult.deduplicationKey}`)
          return {
            success: true,
            stored: false,
            duplicate: true,
            errors: [],
          }
        }
      }

      // Transformation
      let processedItem = item
      if (this.processorConfig.enableTransformation) {
        const transformationResult = await this.transformationService.transformItem(item)

        if (!transformationResult.success) {
          return {
            success: false,
            stored: false,
            duplicate: false,
            errors: transformationResult.errors || ['Transformation failed'],
          }
        }

        processedItem = {
          ...item,
          normalizedData: transformationResult.transformedData!,
        }
      }

      // Storage
      await this.scrapedItemRepository.create(processedItem)

      return {
        success: true,
        stored: true,
        duplicate: false,
        errors: [],
      }
    } catch (error) {
      this.logger.error(`Error processing item directly for job ${item.jobId}:`, error)
      return {
        success: false,
        stored: false,
        duplicate: false,
        errors: [error.message],
      }
    }
  }

  async flushBatches(jobId?: string): Promise<void> {
    try {
      this.logger.log(`Flushing batches${jobId ? ` for job ${jobId}` : ''}`)

      const batchesToFlush = Array.from(this.batchBuffer.keys()).filter(key => !jobId || key.startsWith(`${jobId}::`))

      const flushPromises = batchesToFlush.map(batchKey => this.processBatch(batchKey))
      await Promise.all(flushPromises)

      this.logger.log(`Flushed ${batchesToFlush.length} batches`)
    } catch (error) {
      this.logger.error('Error flushing batches:', error)
      throw error
    }
  }

  async getProcessorStats(jobId: string): Promise<ProcessorStats | null> {
    return this.processorStats.get(jobId) || null
  }

  async getAllStats(): Promise<Map<string, ProcessorStats>> {
    return new Map(this.processorStats)
  }

  private async updateStats(
    jobId: string,
    provider: string,
    updates: {
      processedItems: number
      duplicatesSkipped: number
      itemsStored: number
      transformationErrors: number
      storageErrors: number
    },
  ): Promise<void> {
    const currentStats = this.processorStats.get(jobId) || {
      totalItems: 0,
      duplicatesSkipped: 0,
      itemsStored: 0,
      transformationErrors: 0,
      lastProcessedAt: new Date(),
    }

    const updatedStats: ProcessorStats = {
      totalItems: currentStats.totalItems + updates.processedItems,
      duplicatesSkipped: currentStats.duplicatesSkipped + updates.duplicatesSkipped,
      itemsStored: currentStats.itemsStored + updates.itemsStored,
      transformationErrors: currentStats.transformationErrors + updates.transformationErrors,
      lastProcessedAt: new Date(),
    }

    this.processorStats.set(jobId, updatedStats)

    // Emit stats event
    this.eventEmitter.emit(DATA_PROCESSOR_EVENTS.STATS_UPDATED, {
      jobId,
      provider,
      totalProcessed: updatedStats.totalItems,
      totalDuplicates: updatedStats.duplicatesSkipped,
      totalStored: updatedStats.itemsStored,
      totalErrors: updatedStats.transformationErrors,
      timestamp: new Date(),
    } as DataProcessorStatsEvent)
  }

  private emitErrorEvent(
    jobId: string,
    provider: string,
    error: string,
    stage: 'deduplication' | 'transformation' | 'storage' | 'processing',
    item?: any,
  ): void {
    this.eventEmitter.emit(DATA_PROCESSOR_EVENTS.PROCESSING_ERROR, {
      jobId,
      provider,
      item,
      error,
      stage,
      timestamp: new Date(),
    } as DataProcessorErrorEvent)
  }

  private loadProcessorConfig(): ProcessorConfig {
    return {
      batchSize: this.configService.get('DATA_PROCESSOR_BATCH_SIZE', 50),
      batchTimeoutMs: this.configService.get('DATA_PROCESSOR_BATCH_TIMEOUT_MS', 5000),
      maxRetries: this.configService.get('DATA_PROCESSOR_MAX_RETRIES', 3),
      retryDelayMs: this.configService.get('DATA_PROCESSOR_RETRY_DELAY_MS', 1000),
      enableDeduplication: this.configService.get('DATA_PROCESSOR_ENABLE_DEDUPLICATION', 'true') === 'true',
      enableTransformation: this.configService.get('DATA_PROCESSOR_ENABLE_TRANSFORMATION', 'true') === 'true',
      storageOptions: {
        storeRawHtml: this.configService.get('DATA_PROCESSOR_STORE_RAW_HTML', 'true') === 'true',
        storeNormalizedData: this.configService.get('DATA_PROCESSOR_STORE_NORMALIZED_DATA', 'true') === 'true',
        compressionEnabled: this.configService.get('DATA_PROCESSOR_COMPRESSION_ENABLED', 'false') === 'true',
      },
    }
  }

  async updateProcessorConfig(newConfig: Partial<ProcessorConfig>): Promise<void> {
    this.processorConfig = { ...this.processorConfig, ...newConfig }
    this.logger.log('Processor configuration updated:', newConfig)
  }

  async cleanupJob(jobId: string): Promise<void> {
    try {
      this.logger.log(`Cleaning up processor data for job ${jobId}`)

      // Flush any remaining batches for this job
      await this.flushBatches(jobId)

      // Remove stats
      this.processorStats.delete(jobId)

      // Clear any remaining timers
      Array.from(this.batchTimers.keys())
        .filter(key => key.startsWith(`${jobId}::`))
        .forEach(key => {
          clearTimeout(this.batchTimers.get(key))
          this.batchTimers.delete(key)
        })

      this.logger.log(`Cleanup completed for job ${jobId}`)
    } catch (error) {
      this.logger.error(`Error cleaning up job ${jobId}:`, error)
      throw error
    }
  }
}
