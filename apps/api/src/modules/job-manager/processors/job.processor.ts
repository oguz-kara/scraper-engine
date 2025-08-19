import { Processor, Process } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import type { Job } from 'bull'
import { ConfigService } from '@nestjs/config'

import { JobService } from '../services/job.service'
import { QueueJobData } from '../interfaces/job-events.interface'
import { JobProgress } from '../interfaces/job-input.interface'

@Processor('scraper')
export class JobProcessor {
  private readonly logger = new Logger(JobProcessor.name)
  private readonly checkpointInterval: number
  private readonly progressUpdateInterval: number

  constructor(
    private readonly jobService: JobService,
    private readonly configService: ConfigService,
  ) {
    this.checkpointInterval = this.configService.get<number>('CHECKPOINT_INTERVAL', 10)
    this.progressUpdateInterval = this.configService.get<number>('JOB_PROGRESS_UPDATE_INTERVAL', 5000)
  }

  @Process('simulate.*')
  async processJob(job: Job<QueueJobData>): Promise<void> {
    const { jobId, provider, attempt } = job.data

    this.logger.log(`Processing job ${jobId} for provider ${provider} (attempt ${attempt})`)

    try {
      const scrapingJob = await this.jobService.getJob(jobId)

      if (scrapingJob.status !== 'RUNNING') {
        this.logger.warn(`Job ${jobId} is not in RUNNING status, skipping processing`)
        return
      }

      await this.simulateScrapingProcess(jobId, scrapingJob)

      this.logger.log(`Successfully completed processing job ${jobId}`)
    } catch (error) {
      this.logger.error(`Failed to process job ${jobId}`, error.stack)
      await this.jobService.failJob(jobId, error)
      throw error
    }
  }

  private async simulateScrapingProcess(jobId: string, job: any): Promise<void> {
    try {
      const totalItems = this.getTotalItemsToScrape(job)
      let itemsScraped = job.itemsScraped || 0
      const startTime = Date.now()

      this.logger.log(`Starting scraping simulation for job ${jobId}, total items: ${totalItems}`)

      let lastProgressUpdate = Date.now()
      const progressUpdateThreshold = Math.max(Math.ceil(totalItems * 0.05), 1) // 5% or 1 item minimum

      for (let i = itemsScraped; i < totalItems; i++) {
        const currentJob = await this.jobService.getJob(jobId)

        if (currentJob.status === 'PAUSED') {
          this.logger.log(`Job ${jobId} was paused, stopping processing`)
          return
        }

        if (currentJob.status === 'CANCELLED') {
          this.logger.log(`Job ${jobId} was cancelled, stopping processing`)
          return
        }

        await this.simulateScrapingItem(i, totalItems)
        itemsScraped = i + 1

        const shouldUpdateProgress =
          itemsScraped % progressUpdateThreshold === 0 ||
          itemsScraped % this.checkpointInterval === 0 ||
          Date.now() - lastProgressUpdate >= this.progressUpdateInterval ||
          itemsScraped === totalItems

        if (shouldUpdateProgress) {
          const progressPercentage = Math.round((itemsScraped / totalItems) * 100)
          const elapsedTime = Date.now() - startTime
          const itemsPerSecond = elapsedTime > 0 ? itemsScraped / (elapsedTime / 1000) : 0

          const progress: JobProgress = {
            itemsScraped,
            progressPercentage,
            itemsPerSecond,
            currentInput: this.getCurrentInput(job, itemsScraped, totalItems),
            processedInput: this.getProcessedInput(job, itemsScraped, totalItems),
            remainingInput: this.getRemainingInput(job, itemsScraped, totalItems),
          }

          await this.jobService.updateProgress(jobId, progress)
          lastProgressUpdate = Date.now()

          this.logger.log(`Job ${jobId} progress: ${progressPercentage}% (${itemsScraped}/${totalItems} items)`)
        }

        if (this.shouldRandomlyFail(itemsScraped)) {
          throw new Error(`Simulated failure at item ${itemsScraped}`)
        }
      }

      await this.jobService.completeJob(jobId, itemsScraped)
      this.logger.log(`Completed job ${jobId} with ${itemsScraped} items scraped`)
    } catch (error) {
      this.logger.error(`Error during scraping simulation for job ${jobId}`, error.stack)
      throw error
    }
  }

  private async simulateScrapingItem(itemIndex: number, totalItems: number): Promise<void> {
    const baseDelay = 100
    const randomDelay = Math.random() * 200
    const progressFactor = Math.min((itemIndex / totalItems) * 2, 1)
    const delay = baseDelay + randomDelay * (1 - progressFactor)

    await new Promise(resolve => setTimeout(resolve, delay))
  }

  private getTotalItemsToScrape(job: any): number {
    if (!job.input) {
      return Math.floor(Math.random() * 50) + 10 // Random between 10-60 items
    }

    let totalItems = 0

    if (job.input.searchTerms?.length) {
      totalItems += job.input.searchTerms.length * (Math.floor(Math.random() * 10) + 5) // 5-15 results per search term
    }

    if (job.input.urls?.length) {
      totalItems += job.input.urls.length
    }

    return Math.max(totalItems, 10) // Minimum 10 items
  }

  private getCurrentInput(job: any, itemsScraped: number, totalItems: number): any {
    if (!job.input) return null

    if (job.input.searchTerms?.length) {
      const currentSearchIndex = Math.floor((itemsScraped / totalItems) * job.input.searchTerms.length)
      return {
        searchTerms: [job.input.searchTerms[currentSearchIndex]],
        currentPage: Math.floor(itemsScraped / 10) + 1,
      }
    }

    if (job.input.urls?.length) {
      const currentUrlIndex = Math.floor((itemsScraped / totalItems) * job.input.urls.length)
      return {
        urls: [job.input.urls[currentUrlIndex]],
      }
    }

    return null
  }

  private getProcessedInput(job: any, itemsScraped: number, totalItems: number): any {
    if (!job.input) return null

    if (job.input.searchTerms?.length) {
      const processedSearchIndex = Math.floor((itemsScraped / totalItems) * job.input.searchTerms.length)
      return {
        searchTerms: job.input.searchTerms.slice(0, processedSearchIndex),
      }
    }

    if (job.input.urls?.length) {
      const processedUrlIndex = Math.floor((itemsScraped / totalItems) * job.input.urls.length)
      return {
        urls: job.input.urls.slice(0, processedUrlIndex),
      }
    }

    return null
  }

  private getRemainingInput(job: any, itemsScraped: number, totalItems: number): any {
    if (!job.input) return null

    if (job.input.searchTerms?.length) {
      const processedSearchIndex = Math.floor((itemsScraped / totalItems) * job.input.searchTerms.length)
      return {
        searchTerms: job.input.searchTerms.slice(processedSearchIndex),
      }
    }

    if (job.input.urls?.length) {
      const processedUrlIndex = Math.floor((itemsScraped / totalItems) * job.input.urls.length)
      return {
        urls: job.input.urls.slice(processedUrlIndex),
      }
    }

    return null
  }

  private shouldRandomlyFail(itemsScraped: number): boolean {
    if (itemsScraped < 5) return false

    const failureRate = 0.1 // 10% chance of failure after first 5 items
    return Math.random() < failureRate
  }
}
