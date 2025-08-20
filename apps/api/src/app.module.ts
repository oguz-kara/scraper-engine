import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { BullModule } from '@nestjs/bull'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { JobManagerModule } from './modules/job-manager/job-manager.module'
import { ScraperEngineModule } from './modules/scraper-engine/scraper-engine.module'
import { CheckpointModule } from './modules/checkpoint/checkpoint.module'
import { DataProcessorModule } from './modules/data-processor/data-processor.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: false,
      introspection: true,
      include: [JobManagerModule, ScraperEngineModule, CheckpointModule, DataProcessorModule],
      path: '/graphql',
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      subscriptions: {
        'graphql-ws': true,
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async configService => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    JobManagerModule,
    ScraperEngineModule,
    CheckpointModule,
    DataProcessorModule,
  ],
})
export class AppModule {}
