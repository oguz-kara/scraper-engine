import { Processor, Process } from '@nestjs/bull'
import type { Job } from 'bull'
import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { JobService } from '../../job-manager/services/job.service'
import { ScraperOrchestratorService } from '../services/scraper-orchestrator.service'
import { JobStatus } from '@prisma/client'

interface QueueJobData {
  jobId: string
  provider: string
  attempt: number
}

@Processor('scraper')
@Injectable()
export class ScrapingProcessor {
  constructor(
    private jobService: JobService,
    private scraperOrchestrator: ScraperOrchestratorService,
    private eventEmitter: EventEmitter2,
  ) {
    console.log('🚀 [DEBUG] ScrapingProcessor initialized!')
  }

  @Process()
  async processJob(job: Job<QueueJobData>): Promise<void> {
    console.log('📥 [DEBUG] Processor received job:', job.name, job.data)
    const { jobId } = job.data
    const startTime = Date.now()

    console.log(`[ScrapingProcessor] Starting job ${jobId} (attempt ${job.data.attempt || 1})`)

    try {
      // Load job from database
      const scrapingJob = await this.jobService.getJob(jobId)
      if (!scrapingJob) {
        throw new Error(`Job ${jobId} not found in database`)
      }

      // Check if job is in correct state
      if (scrapingJob.status !== JobStatus.PENDING && scrapingJob.status !== JobStatus.RUNNING) {
        console.log(`Job ${jobId} is in ${scrapingJob.status} state, skipping processing`)
        return
      }

      console.log(`[ScrapingProcessor] Processing job ${jobId} with provider ${scrapingJob.provider}`)

      // Job will be updated to RUNNING by JobService.startJob() when it adds to queue
      // But we can emit the event here for real-time updates

      // Emit job started event
      this.eventEmitter.emit('job.statusChanged', {
        jobId,
        status: JobStatus.RUNNING,
        startedAt: new Date(),
      })

      // Status transitions are handled by services/orchestrator

      // Execute scraping via orchestrator
      await this.scraperOrchestrator.executeJob(scrapingJob)

      // Mark as completed - this will be done by the orchestrator events
      // but we ensure it here as well
      const duration = Date.now() - startTime
      await this.jobService.completeJob(jobId, 0) // itemsScraped will be tracked elsewhere

      console.log(`[ScrapingProcessor] Job ${jobId} completed successfully in ${duration}ms`)
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[ScrapingProcessor] Job ${jobId} failed after ${duration}ms:`, error)

      // Determine if this is a retryable error
      const isRetryable = this.isRetryableError(error)
      const attemptCount = job.data.attempt || 1
      const maxRetries = 3 // Could be configurable

      if (isRetryable && attemptCount < maxRetries) {
        console.log(`[ScrapingProcessor] Job ${jobId} failed but is retryable (attempt ${attemptCount}/${maxRetries})`)

        // Don't mark as failed yet, let BullMQ retry
        throw error
      } else {
        // Mark as permanently failed
        await this.jobService.failJob(jobId, error)

        console.log(`[ScrapingProcessor] Job ${jobId} marked as permanently failed`)

        // Still throw to ensure BullMQ knows it failed
        throw error
      }
    }
  }

  @Process('scraper.pause')
  async pauseJob(job: Job<{ jobId: string }>): Promise<void> {
    const { jobId } = job.data

    try {
      console.log(`[ScrapingProcessor] Pausing job ${jobId}`)

      // Update job status using existing pauseJob method
      await this.jobService.pauseJob(jobId)

      // Notify orchestrator to pause
      await this.scraperOrchestrator.pauseJob(jobId)

      this.eventEmitter.emit('job.statusChanged', {
        jobId,
        status: JobStatus.PAUSED,
        pausedAt: new Date(),
      })
    } catch (error) {
      console.error(`[ScrapingProcessor] Failed to pause job ${jobId}:`, error)
      throw error
    }
  }

  @Process('scraper.cancel')
  async cancelJob(job: Job<{ jobId: string }>): Promise<void> {
    const { jobId } = job.data

    try {
      console.log(`[ScrapingProcessor] Cancelling job ${jobId}`)

      // Update job status using existing cancelJob method
      await this.jobService.cancelJob(jobId)

      // Notify orchestrator to cancel
      await this.scraperOrchestrator.cancelJob(jobId)

      this.eventEmitter.emit('job.statusChanged', {
        jobId,
        status: JobStatus.CANCELLED,
        cancelledAt: new Date(),
      })
    } catch (error) {
      console.error(`[ScrapingProcessor] Failed to cancel job ${jobId}:`, error)
      throw error
    }
  }

  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'Navigation failed',
      'Browser disconnected',
    ]

    const errorMessage = error.message.toLowerCase()
    return retryablePatterns.some(pattern => errorMessage.includes(pattern.toLowerCase()))
  }

  private getErrorCode(error: Error): string {
    // Map common errors to error codes
    const errorMessage = error.message.toLowerCase()

    if (errorMessage.includes('timeout')) return 'TIMEOUT'
    if (errorMessage.includes('network') || errorMessage.includes('connection')) return 'NETWORK_ERROR'
    if (errorMessage.includes('browser')) return 'BROWSER_ERROR'
    if (errorMessage.includes('navigation')) return 'NAVIGATION_ERROR'
    if (errorMessage.includes('selector') || errorMessage.includes('element')) return 'SELECTOR_ERROR'
    if (errorMessage.includes('iframe')) return 'IFRAME_ERROR'
    if (errorMessage.includes('strategy')) return 'STRATEGY_ERROR'

    return 'UNKNOWN_ERROR'
  }

  // Health check method
  async getProcessorStatus(): Promise<any> {
    const orchestratorStatus = await this.scraperOrchestrator.getSystemStatus()

    return {
      processor: 'ScrapingProcessor',
      status: 'active',
      ...orchestratorStatus,
      timestamp: new Date(),
    }
  }
}
