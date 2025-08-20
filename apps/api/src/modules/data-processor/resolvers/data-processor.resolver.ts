import { Resolver, Query, Mutation, Args, ID, Subscription } from '@nestjs/graphql'
import { Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { DataProcessorService } from '../services/data-processor.service'
import { BatchQueueService } from '../services/batch-queue.service'
import { TransformationService } from '../services/transformation.service'
import { DeduplicationService } from '../services/deduplication.service'
import { ScrapedItemRepository } from '../repositories/scraped-item.repository'
import {
  ScrapedItemEntity,
  ScrapedItemStatsEntity,
  ProcessorStatsEntity,
  BatchProcessingStatsEntity,
  TransformationResultEntity,
  DeduplicationResultEntity,
} from '../entities/scraped-item.entity'
import {
  CreateScrapedItemInput,
  ProcessItemDirectlyInput,
  GetScrapedItemsInput,
  TestTransformationInput,
  TestDeduplicationInput,
  UpdateProcessorConfigInput,
} from '../dto/scraped-item.dto'
import { PubSub } from 'graphql-subscriptions'
import { DATA_PROCESSOR_EVENTS, type DataProcessorStatsEvent } from '../events/processor.events'

@Resolver(() => ScrapedItemEntity)
export class DataProcessorResolver {
  private readonly logger = new Logger(DataProcessorResolver.name)
  private pubSub = new PubSub() as any

  private getAsyncIterator(trigger: string) {
    const method = this.pubSub.asyncIterator || this.pubSub.asyncIterableIterator
    if (typeof method !== 'function') {
      throw new Error('PubSub does not expose an async iterator method')
    }
    return method.call(this.pubSub, trigger)
  }

  constructor(
    private dataProcessorService: DataProcessorService,
    private batchQueueService: BatchQueueService,
    private transformationService: TransformationService,
    private deduplicationService: DeduplicationService,
    private scrapedItemRepository: ScrapedItemRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.setupEventListeners()
  }

  @Query(() => [ScrapedItemEntity])
  async getScrapedItems(@Args('input') input: GetScrapedItemsInput): Promise<ScrapedItemEntity[]> {
    try {
      const items = await this.scrapedItemRepository.findByJobId(input.jobId, input.limit, input.offset)

      return items.map(item => ({
        id: item.id!,
        jobId: item.jobId,
        provider: item.provider,
        deduplicationKey: item.deduplicationKey,
        rawHtml: item.rawHtml,
        normalizedData: item.normalizedData,
        sourceUrl: item.sourceUrl,
        scrapedAt: item.scrapedAt,
        metadata: item.metadata,
      }))
    } catch (error) {
      this.logger.error(`Error getting scraped items for job ${input.jobId}:`, error)
      throw error
    }
  }

  @Query(() => ScrapedItemStatsEntity)
  async getScrapedItemStats(@Args('jobId', { type: () => ID }) jobId: string): Promise<ScrapedItemStatsEntity> {
    try {
      const stats = await this.scrapedItemRepository.getJobStats(jobId)

      // Mock provider stats for now - this would need database aggregation
      const providerStats = [
        {
          provider: 'SHELL',
          totalItems: stats.totalItems,
          successfulTransformations: stats.totalItems,
          failedTransformations: 0,
          lastProcessedAt: stats.latestItem?.scrapedAt,
        },
      ]

      return {
        totalItems: stats.totalItems,
        uniqueItems: stats.totalItems, // All stored items are unique due to deduplication
        duplicatesSkipped: 0, // Would need separate tracking
        lastScrapedAt: stats.latestItem?.scrapedAt,
        firstScrapedAt: stats.oldestItem?.scrapedAt,
        byProvider: providerStats,
      }
    } catch (error) {
      this.logger.error(`Error getting scraped item stats for job ${jobId}:`, error)
      throw error
    }
  }

  @Query(() => ProcessorStatsEntity, { nullable: true })
  async getProcessorStats(@Args('jobId', { type: () => ID }) jobId: string): Promise<ProcessorStatsEntity | null> {
    try {
      const stats = await this.dataProcessorService.getProcessorStats(jobId)

      if (!stats) {
        return null
      }

      const successRate = stats.totalItems > 0 ? (stats.itemsStored / stats.totalItems) * 100 : 0

      const duplicateRate = stats.totalItems > 0 ? (stats.duplicatesSkipped / stats.totalItems) * 100 : 0

      return {
        jobId,
        totalItems: stats.totalItems,
        duplicatesSkipped: stats.duplicatesSkipped,
        itemsStored: stats.itemsStored,
        transformationErrors: stats.transformationErrors,
        lastProcessedAt: stats.lastProcessedAt,
        successRate,
        duplicateRate,
      }
    } catch (error) {
      this.logger.error(`Error getting processor stats for job ${jobId}:`, error)
      throw error
    }
  }

  @Query(() => BatchProcessingStatsEntity)
  async getBatchProcessingStats(@Args('jobId', { type: () => ID }) jobId: string): Promise<BatchProcessingStatsEntity> {
    try {
      const stats = await this.batchQueueService.getJobBatchStatus(jobId)

      const totalBatches = stats.totalBatches
      const completedBatches = stats.completed
      const progress = totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0

      // Estimate time remaining based on average processing time
      // This is a rough estimate - would need more sophisticated calculation
      const estimatedTimeRemaining =
        stats.active > 0 && progress < 100
          ? Math.round((100 - progress) * 60) // rough estimate in seconds
          : undefined

      return {
        jobId,
        totalBatches,
        completedBatches: stats.completed,
        failedBatches: stats.failed,
        activeBatches: stats.active,
        waitingBatches: stats.waiting,
        progress,
        estimatedTimeRemaining,
      }
    } catch (error) {
      this.logger.error(`Error getting batch processing stats for job ${jobId}:`, error)
      throw error
    }
  }

  @Mutation(() => ScrapedItemEntity)
  async createScrapedItem(@Args('input') input: CreateScrapedItemInput): Promise<ScrapedItemEntity> {
    try {
      const scrapedItemInput = {
        jobId: input.jobId,
        provider: input.provider,
        rawHtml: input.rawHtml,
        normalizedData: input.normalizedData,
        sourceUrl: input.sourceUrl,
        metadata: input.metadata,
      }

      const item = await this.scrapedItemRepository.create(scrapedItemInput)

      return {
        id: item.id!,
        jobId: item.jobId,
        provider: item.provider,
        deduplicationKey: item.deduplicationKey,
        rawHtml: item.rawHtml,
        normalizedData: item.normalizedData,
        sourceUrl: item.sourceUrl,
        scrapedAt: item.scrapedAt,
        metadata: item.metadata,
      }
    } catch (error) {
      this.logger.error(`Error creating scraped item:`, error)
      throw error
    }
  }

  @Mutation(() => Boolean)
  async processItemDirectly(@Args('input') input: ProcessItemDirectlyInput): Promise<boolean> {
    try {
      const scrapedItemInput = {
        jobId: input.jobId,
        provider: input.provider,
        rawHtml: input.rawHtml,
        normalizedData: input.normalizedData,
        sourceUrl: input.sourceUrl,
        metadata: input.metadata,
      }

      const result = await this.dataProcessorService.processItemDirectly(scrapedItemInput)
      return result.success
    } catch (error) {
      this.logger.error(`Error processing item directly:`, error)
      throw error
    }
  }

  @Mutation(() => Boolean)
  async flushBatches(@Args('jobId', { type: () => ID, nullable: true }) jobId?: string): Promise<boolean> {
    try {
      await this.dataProcessorService.flushBatches(jobId)
      return true
    } catch (error) {
      this.logger.error(`Error flushing batches${jobId ? ` for job ${jobId}` : ''}:`, error)
      throw error
    }
  }

  @Mutation(() => Boolean)
  async updateProcessorConfig(@Args('input') input: UpdateProcessorConfigInput): Promise<boolean> {
    try {
      await this.dataProcessorService.updateProcessorConfig(input as any)
      return true
    } catch (error) {
      this.logger.error(`Error updating processor config:`, error)
      throw error
    }
  }

  @Mutation(() => TransformationResultEntity)
  async testTransformation(@Args('input') input: TestTransformationInput): Promise<TransformationResultEntity> {
    try {
      const startTime = Date.now()
      const result = await this.transformationService.testTransformer(input.provider, input.testData)
      const processingTime = Date.now() - startTime

      if (!result.transformerFound) {
        return {
          success: false,
          errors: [`No transformer found for provider: ${input.provider}`],
          processingTime,
        }
      }

      return {
        success: result.transformationResult?.success || false,
        data: result.transformationResult?.data,
        errors: result.transformationResult?.errors,
        warnings: result.transformationResult?.warnings,
        processingTime: result.processingTime,
      }
    } catch (error) {
      this.logger.error(`Error testing transformation for provider ${input.provider}:`, error)
      throw error
    }
  }

  @Mutation(() => DeduplicationResultEntity)
  async testDeduplication(@Args('input') input: TestDeduplicationInput): Promise<DeduplicationResultEntity> {
    try {
      const scrapedItemInput = {
        jobId: 'test',
        provider: input.provider,
        rawHtml: '',
        normalizedData: input.itemData,
        sourceUrl: input.sourceUrl,
        metadata: { provider: input.provider },
      }

      const result = await this.deduplicationService.checkDuplicate(scrapedItemInput)

      return {
        isDuplicate: result.isDuplicate,
        deduplicationKey: result.deduplicationKey,
        existingItem: result.existingItem
          ? {
              id: result.existingItem.id,
              jobId: result.existingItem.jobId,
              provider: result.existingItem.provider,
              deduplicationKey: result.existingItem.deduplicationKey,
              rawHtml: result.existingItem.rawHtml,
              normalizedData: result.existingItem.normalizedData,
              sourceUrl: result.existingItem.sourceUrl,
              scrapedAt: result.existingItem.scrapedAt,
              metadata: result.existingItem.metadata,
            }
          : undefined,
        checkedAt: new Date(),
      }
    } catch (error) {
      this.logger.error(`Error testing deduplication for provider ${input.provider}:`, error)
      throw error
    }
  }

  @Query(() => [String])
  async getAvailableTransformers(): Promise<string[]> {
    try {
      const transformers = this.transformationService.getAvailableTransformers()
      return transformers.map(t => t.provider)
    } catch (error) {
      this.logger.error('Error getting available transformers:', error)
      throw error
    }
  }

  @Query(() => [String])
  async getAvailableDeduplicationStrategies(): Promise<string[]> {
    try {
      return this.deduplicationService.getRegisteredProviders()
    } catch (error) {
      this.logger.error('Error getting available deduplication strategies:', error)
      throw error
    }
  }

  @Subscription(() => ProcessorStatsEntity)
  async processorStatsUpdated(@Args('jobId', { type: () => ID }) jobId: string) {
    return this.getAsyncIterator(`processorStats.${jobId}`)
  }

  @Subscription(() => ScrapedItemEntity)
  async itemProcessed(@Args('jobId', { type: () => ID }) jobId: string) {
    return this.getAsyncIterator(`itemProcessed.${jobId}`)
  }

  private setupEventListeners(): void {
    this.eventEmitter.on(DATA_PROCESSOR_EVENTS.STATS_UPDATED, (payload: DataProcessorStatsEvent) => {
      try {
        const successRate = payload.totalProcessed > 0 ? (payload.totalStored / payload.totalProcessed) * 100 : 0
        const duplicateRate = payload.totalProcessed > 0 ? (payload.totalDuplicates / payload.totalProcessed) * 100 : 0

        this.pubSub.publish(`processorStats.${payload.jobId}`, {
          processorStatsUpdated: {
            jobId: payload.jobId,
            totalItems: payload.totalProcessed,
            duplicatesSkipped: payload.totalDuplicates,
            itemsStored: payload.totalStored,
            transformationErrors: payload.totalErrors,
            lastProcessedAt: payload.timestamp,
            successRate,
            duplicateRate,
          },
        })
      } catch (error) {
        this.logger.error(`Failed to publish processorStatsUpdated for ${payload.jobId}`, error?.stack || String(error))
      }
    })
  }
}
