import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'

// Import JobManager module for PrismaService
import { JobManagerModule } from '../job-manager/job-manager.module'
import { DatabaseModule } from '../../common/database/database.module'

// Services
import { DataProcessorService } from './services/data-processor.service'
import {
  DeduplicationService,
  ShellDeduplicationStrategy,
  CastrolDeduplicationStrategy,
} from './services/deduplication.service'
import { TransformationService } from './services/transformation.service'
import { BatchQueueService } from './services/batch-queue.service'

// Repositories
import { ScrapedItemRepository } from './repositories/scraped-item.repository'

// Transformers
import { ShellTransformer } from './transformers/shell.transformer'

// Processors
import { BatchProcessor } from './processors/batch.processor'

// Resolvers
import { DataProcessorResolver } from './resolvers/data-processor.resolver'

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule,
    JobManagerModule, // Import to get PrismaService
    DatabaseModule, // Direct access to PrismaService
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'data-processor-batch',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
  providers: [
    // Core Services
    DataProcessorService,
    BatchQueueService,

    // Deduplication
    DeduplicationService,
    ShellDeduplicationStrategy,
    CastrolDeduplicationStrategy,

    // Transformation
    TransformationService,
    ShellTransformer,

    // Repository
    ScrapedItemRepository,

    // Queue Processor
    BatchProcessor,

    // GraphQL Resolver
    DataProcessorResolver,
  ],
  exports: [
    DataProcessorService,
    BatchQueueService,
    DeduplicationService,
    TransformationService,
    ScrapedItemRepository,
  ],
})
export class DataProcessorModule {}
