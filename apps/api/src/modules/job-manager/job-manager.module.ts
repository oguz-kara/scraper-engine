import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { DatabaseModule } from '../../common/database/database.module'
import { JobRepository } from './repositories/job.repository'
import { JobService } from './services/job.service'
import { JobProcessor } from './processors/job.processor'
import { JobResolver } from './resolvers/job.resolver'

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule,
    DatabaseModule,
    BullModule.registerQueueAsync({
      name: 'scraper',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 10,
          removeOnFail: 10,
        },
        settings: {
          stalledInterval: 30 * 1000,
          maxStalledCount: 1,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JobRepository, JobService, JobProcessor, JobResolver],
  exports: [JobService, JobRepository],
})
export class JobManagerModule {}
