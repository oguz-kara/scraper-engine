import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { ConfigModule } from '@nestjs/config'
import { BrowserManagerService } from './services/browser-manager.service'
import { ScraperOrchestratorService } from './services/scraper-orchestrator.service'
import { ScrapingProcessor } from './processors/scraping.processor'
import { JobManagerModule } from '../job-manager/job-manager.module'

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'scraper',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10, // Keep 10 completed jobs
        removeOnFail: 20, // Keep 20 failed jobs for debugging
      },
    }),
    JobManagerModule, // Import to use JobService
  ],
  providers: [BrowserManagerService, ScraperOrchestratorService, ScrapingProcessor],
  exports: [ScraperOrchestratorService, BrowserManagerService],
})
export class ScraperEngineModule {}
