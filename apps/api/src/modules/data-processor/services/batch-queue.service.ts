import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { ConfigService } from '@nestjs/config'
import { ScrapedItemInput } from '../interfaces/scraped-item.interface'
import { BatchProcessorJob } from '../processors/batch.processor'
import { randomUUID } from 'crypto'

@Injectable()
export class BatchQueueService implements OnModuleInit {
  private readonly logger = new Logger(BatchQueueService.name)
  private readonly maxBatchSize: number
  private readonly maxQueueSize: number
  private readonly defaultPriority: number

  constructor(
    @InjectQueue('data-processor-batch') private batchQueue: Queue<BatchProcessorJob>,
    private configService: ConfigService,
  ) {
    this.maxBatchSize = this.configService.get('BATCH_PROCESSOR_MAX_BATCH_SIZE', 100)
    this.maxQueueSize = this.configService.get('BATCH_PROCESSOR_MAX_QUEUE_SIZE', 1000)
    this.defaultPriority = this.configService.get('BATCH_PROCESSOR_DEFAULT_PRIORITY', 0)
  }

  async onModuleInit() {
    this.logger.log('Batch Queue Service initialized')

    // Log current queue status
    const queueStats = await this.getQueueStats()
    this.logger.log(`Queue stats: ${JSON.stringify(queueStats)}`)
  }

  async addBatch(
    items: ScrapedItemInput[],
    jobId: string,
    provider: string,
    options?: {
      priority?: number
      delay?: number
      maxRetries?: number
    },
  ): Promise<string[]> {
    try {
      if (items.length === 0) {
        this.logger.warn(`No items to process for job ${jobId}`)
        return []
      }

      // Check queue size limit
      const queueSize = await this.batchQueue.count()
      if (queueSize >= this.maxQueueSize) {
        throw new Error(`Queue size limit reached (${this.maxQueueSize}). Current size: ${queueSize}`)
      }

      // Split items into batches if needed
      const batches = this.splitIntoBatches(items, this.maxBatchSize)
      const batchIds: string[] = []

      this.logger.log(`Adding ${batches.length} batches for job ${jobId} (${items.length} total items)`)

      // Add each batch to the queue
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        const batchId = `${jobId}_batch_${i + 1}_${randomUUID().substring(0, 8)}`

        const jobData: BatchProcessorJob = {
          items: batch,
          jobId,
          provider,
          batchId,
          priority: options?.priority || this.defaultPriority,
        }

        const queueJob = await this.batchQueue.add('process-batch', jobData, {
          priority: options?.priority || this.defaultPriority,
          delay: options?.delay || 0,
          attempts: (options?.maxRetries || 3) + 1,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50, // Keep last 50 failed jobs
        })

        batchIds.push(batchId)
        this.logger.debug(`Added batch ${batchId} to queue with job ID ${queueJob.id}`)
      }

      return batchIds
    } catch (error) {
      this.logger.error(`Error adding batches for job ${jobId}:`, error)
      throw error
    }
  }

  async pauseProcessingForJob(jobId: string): Promise<number> {
    try {
      const jobs = await this.batchQueue.getJobs(['waiting', 'delayed'])
      const jobsToRemove = jobs.filter(job => job.data.jobId === jobId)

      let pausedCount = 0
      for (const job of jobsToRemove) {
        await job.remove()
        pausedCount++
      }

      this.logger.log(`Paused ${pausedCount} batch jobs for job ${jobId}`)
      return pausedCount
    } catch (error) {
      this.logger.error(`Error pausing batch jobs for job ${jobId}:`, error)
      throw error
    }
  }

  async resumeProcessingForJob(jobId: string, items: ScrapedItemInput[], provider: string): Promise<string[]> {
    try {
      this.logger.log(`Resuming batch processing for job ${jobId}`)
      return await this.addBatch(items, jobId, provider)
    } catch (error) {
      this.logger.error(`Error resuming batch processing for job ${jobId}:`, error)
      throw error
    }
  }

  async getJobBatchStatus(jobId: string): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
    totalBatches: number
  }> {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        this.batchQueue.getJobs(['waiting']),
        this.batchQueue.getJobs(['active']),
        this.batchQueue.getJobs(['completed']),
        this.batchQueue.getJobs(['failed']),
      ])

      const filterByJobId = (jobs: any[]) => jobs.filter(job => job.data.jobId === jobId)

      const waitingCount = filterByJobId(waiting).length
      const activeCount = filterByJobId(active).length
      const completedCount = filterByJobId(completed).length
      const failedCount = filterByJobId(failed).length

      return {
        waiting: waitingCount,
        active: activeCount,
        completed: completedCount,
        failed: failedCount,
        totalBatches: waitingCount + activeCount + completedCount + failedCount,
      }
    } catch (error) {
      this.logger.error(`Error getting batch status for job ${jobId}:`, error)
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        totalBatches: 0,
      }
    }
  }

  async getQueueStats(): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
    total: number
  }> {
    try {
      const counts = await this.batchQueue.getJobCounts()

      return {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
        total: Object.values(counts).reduce((sum, count) => sum + (count || 0), 0),
      }
    } catch (error) {
      this.logger.error('Error getting queue stats:', error)
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
      }
    }
  }

  async cleanupCompletedJobs(): Promise<number> {
    try {
      const completed = await this.batchQueue.clean(24 * 60 * 60 * 1000, 100, 'completed')
      const failed = await this.batchQueue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed')

      const totalCleaned = completed.length + failed.length
      this.logger.log(
        `Cleaned up ${totalCleaned} old batch jobs (${completed.length} completed, ${failed.length} failed)`,
      )

      return totalCleaned
    } catch (error) {
      this.logger.error('Error cleaning up completed jobs:', error)
      return 0
    }
  }

  async retryFailedJobs(jobId?: string): Promise<number> {
    try {
      const failedJobs = await this.batchQueue.getJobs(['failed'])
      const jobsToRetry = jobId ? failedJobs.filter(job => job.data.jobId === jobId) : failedJobs

      let retriedCount = 0
      for (const job of jobsToRetry) {
        await job.retry()
        retriedCount++
      }

      this.logger.log(`Retried ${retriedCount} failed batch jobs${jobId ? ` for job ${jobId}` : ''}`)
      return retriedCount
    } catch (error) {
      this.logger.error(`Error retrying failed jobs${jobId ? ` for job ${jobId}` : ''}:`, error)
      return 0
    }
  }

  async clearQueue(): Promise<void> {
    try {
      await this.batchQueue.drain()
      await this.batchQueue.clean(0, 0, 'completed')
      await this.batchQueue.clean(0, 0, 'failed')

      this.logger.log('Batch queue cleared')
    } catch (error) {
      this.logger.error('Error clearing batch queue:', error)
      throw error
    }
  }

  private splitIntoBatches(items: ScrapedItemInput[], batchSize: number): ScrapedItemInput[][] {
    const batches: ScrapedItemInput[][] = []

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }

    return batches
  }

  async getQueueHealth(): Promise<{
    isHealthy: boolean
    queueStats: any
    issues: string[]
  }> {
    try {
      const stats = await this.getQueueStats()
      const issues: string[] = []

      // Check for potential issues
      if (stats.waiting > 500) {
        issues.push(`High number of waiting jobs: ${stats.waiting}`)
      }

      if (stats.failed > 100) {
        issues.push(`High number of failed jobs: ${stats.failed}`)
      }

      if (stats.active === 0 && stats.waiting > 0) {
        issues.push('Jobs are waiting but none are active - possible worker issue')
      }

      return {
        isHealthy: issues.length === 0,
        queueStats: stats,
        issues,
      }
    } catch (error) {
      this.logger.error('Error checking queue health:', error)
      return {
        isHealthy: false,
        queueStats: null,
        issues: [`Health check failed: ${error.message}`],
      }
    }
  }
}
