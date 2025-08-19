import { Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ScrapingProvider, ScrapingJob } from '@prisma/client'
import { Browser } from 'playwright'
import { BrowserManagerService } from './browser-manager.service'
import { BaseScraperStrategy } from '../strategies/base.strategy'
import { ShellScraperStrategy } from '../strategies/shell.strategy'

@Injectable()
export class ScraperOrchestratorService implements OnModuleInit {
  private strategies: Map<ScrapingProvider, BaseScraperStrategy> = new Map()

  constructor(
    private browserManager: BrowserManagerService,
    private eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.registerStrategies()
  }

  private registerStrategies(): void {
    // Register all available scraper strategies
    this.strategies.set(ScrapingProvider.SHELL, new ShellScraperStrategy(this.eventEmitter))

    // Future strategies can be added here:
    // this.strategies.set(
    //   ScrapingProvider.CASTROL,
    //   new CastrolScraperStrategy(this.eventEmitter)
    // );

    console.log(`Registered ${this.strategies.size} scraper strategies:`, Array.from(this.strategies.keys()))
  }

  async executeJob(job: ScrapingJob): Promise<void> {
    const startTime = Date.now()
    console.log(`Starting scraper execution for job ${job.id} (${job.provider})`)

    const strategy = this.strategies.get(job.provider)
    if (!strategy) {
      throw new Error(`No scraper strategy found for provider: ${job.provider}`)
    }

    let browser: Browser | null = null

    try {
      // Launch browser for this job
      browser = await this.browserManager.launchBrowser(job.id)
      console.log(`Browser launched for job ${job.id}`)

      // Initialize strategy with browser
      if (!browser) {
        throw new Error('Failed to launch browser')
      }
      await strategy.initialize(browser)
      console.log(`Strategy initialized for job ${job.id}`)

      // Emit job started event
      this.eventEmitter.emit('job.started', {
        jobId: job.id,
        provider: job.provider,
        startedAt: new Date(),
      })

      // Execute scraping with progress tracking
      let itemCount = 0
      const generator = strategy.scrape(job.id, job.input as any, (processed, total) => {
        // Emit progress update
        this.eventEmitter.emit('job.progressUpdated', {
          jobId: job.id,
          percentage: total > 0 ? (processed / total) * 100 : 0,
          itemsScraped: itemCount,
          itemsPerSecond: this.calculateItemsPerSecond(itemCount, startTime),
          timestamp: new Date(),
        })
      })

      // Process scraped items as they come
      for await (const item of generator) {
        itemCount++

        // Emit item found event for data processor to handle
        this.eventEmitter.emit('scraper.itemFound', {
          jobId: job.id,
          item,
        })

        // Emit progress update every 10 items
        if (itemCount % 10 === 0) {
          this.eventEmitter.emit('job.progressUpdated', {
            jobId: job.id,
            itemsScraped: itemCount,
            itemsPerSecond: this.calculateItemsPerSecond(itemCount, startTime),
            timestamp: new Date(),
          })
        }

        // Optional: Save checkpoint every 50 items
        if (itemCount % 50 === 0) {
          await this.saveCheckpoint(job.id, strategy, itemCount)
        }
      }

      // Final progress update
      const duration = Date.now() - startTime
      this.eventEmitter.emit('job.progressUpdated', {
        jobId: job.id,
        percentage: 100,
        itemsScraped: itemCount,
        itemsPerSecond: this.calculateItemsPerSecond(itemCount, startTime),
        timestamp: new Date(),
      })

      // Emit job completed event
      this.eventEmitter.emit('job.completed', {
        jobId: job.id,
        itemsScraped: itemCount,
        duration,
        completedAt: new Date(),
      })

      console.log(`Job ${job.id} completed successfully. Scraped ${itemCount} items in ${duration}ms`)
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error)

      // Emit job failed event
      this.eventEmitter.emit('job.failed', {
        jobId: job.id,
        error: error.message,
        stack: error.stack,
        failedAt: new Date(),
      })

      throw error
    } finally {
      // Cleanup strategy
      try {
        await strategy.cleanup()
      } catch (cleanupError) {
        console.warn(`Strategy cleanup failed for job ${job.id}:`, cleanupError)
      }

      // Close browser
      try {
        await this.browserManager.closeBrowser(job.id)
      } catch (browserError) {
        console.warn(`Browser cleanup failed for job ${job.id}:`, browserError)
      }
    }
  }

  async pauseJob(jobId: string): Promise<void> {
    console.log(`Pausing job ${jobId}`)

    try {
      // Get the strategy if job is running
      // Note: In a full implementation, we'd need to track running jobs
      // and their strategies to properly pause them

      // For now, we'll emit a pause event and let the job manager handle it
      this.eventEmitter.emit('job.pauseRequested', {
        jobId,
        pausedAt: new Date(),
      })

      // In the future, this could:
      // 1. Save current browser state as checkpoint
      // 2. Gracefully stop the scraping generator
      // 3. Close browser but keep strategy state
    } catch (error) {
      console.error(`Error pausing job ${jobId}:`, error)
      throw error
    }
  }

  async resumeJob(job: ScrapingJob, checkpoint?: any): Promise<void> {
    console.log(`Resuming job ${job.id} from checkpoint`)

    const strategy = this.strategies.get(job.provider)
    if (!strategy) {
      throw new Error(`No scraper strategy found for provider: ${job.provider}`)
    }

    try {
      // Launch new browser
      const browser = await this.browserManager.launchBrowser(job.id)

      // Initialize strategy
      await strategy.initialize(browser)

      // Restore browser state from checkpoint if available
      if (checkpoint && checkpoint.browserState) {
        await strategy.restoreBrowserState(checkpoint.browserState)
      }

      // Continue execution from where it left off
      // Note: This would require modifying the scrape method to accept
      // a starting point/state parameter
      await this.executeJob(job)
    } catch (error) {
      console.error(`Error resuming job ${job.id}:`, error)
      throw error
    }
  }

  async cancelJob(jobId: string): Promise<void> {
    console.log(`Cancelling job ${jobId}`)

    try {
      // Emit cancel event
      this.eventEmitter.emit('job.cancelRequested', {
        jobId,
        cancelledAt: new Date(),
      })

      // Close browser immediately
      await this.browserManager.closeBrowser(jobId)
    } catch (error) {
      console.error(`Error cancelling job ${jobId}:`, error)
      throw error
    }
  }

  private calculateItemsPerSecond(itemCount: number, startTime: number): number {
    const elapsedSeconds = (Date.now() - startTime) / 1000
    return elapsedSeconds > 0 ? Math.round((itemCount / elapsedSeconds) * 100) / 100 : 0
  }

  private async saveCheckpoint(jobId: string, strategy: BaseScraperStrategy, itemCount: number): Promise<void> {
    try {
      const browserState = await strategy.saveBrowserState()

      this.eventEmitter.emit('checkpoint.save', {
        jobId,
        sequenceNumber: Math.floor(itemCount / 50), // Checkpoint every 50 items
        state: {
          browserState,
          itemCount,
          timestamp: new Date(),
        },
      })
    } catch (error) {
      console.warn(`Failed to save checkpoint for job ${jobId}:`, error)
      // Don't throw - checkpoints are optional
    }
  }

  // Health check and monitoring methods
  getAvailableProviders(): ScrapingProvider[] {
    return Array.from(this.strategies.keys())
  }

  async getSystemStatus(): Promise<any> {
    const browserStatus = await this.browserManager.healthCheck()

    return {
      strategies: {
        registered: this.strategies.size,
        providers: this.getAvailableProviders(),
      },
      browsers: browserStatus,
      timestamp: new Date(),
    }
  }

  async forceStopJob(jobId: string): Promise<void> {
    console.log(`Force stopping job ${jobId}`)

    try {
      // Immediately close browser without cleanup
      await this.browserManager.closeBrowser(jobId)

      this.eventEmitter.emit('job.forceStopped', {
        jobId,
        stoppedAt: new Date(),
      })
    } catch (error) {
      console.error(`Error force stopping job ${jobId}:`, error)
      throw error
    }
  }
}
