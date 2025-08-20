import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql'
import { GraphQLJSON } from 'graphql-type-json'

@ObjectType('ScrapedItem')
export class ScrapedItemEntity {
  @Field(() => ID)
  id: string

  @Field(() => ID)
  jobId: string

  @Field()
  provider: string

  @Field()
  deduplicationKey: string

  @Field()
  rawHtml: string

  @Field(() => GraphQLJSON)
  normalizedData: Record<string, any>

  @Field({ nullable: true })
  sourceUrl?: string

  @Field(() => Date)
  scrapedAt: Date

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: Record<string, any>
}

@ObjectType('ScrapedItemStats')
export class ScrapedItemStatsEntity {
  @Field(() => Int)
  totalItems: number

  @Field(() => Int)
  uniqueItems: number

  @Field(() => Int)
  duplicatesSkipped: number

  @Field(() => Date, { nullable: true })
  lastScrapedAt?: Date

  @Field(() => Date, { nullable: true })
  firstScrapedAt?: Date

  @Field(() => [ProviderStatsEntity])
  byProvider: ProviderStatsEntity[]
}

@ObjectType('ProviderStats')
export class ProviderStatsEntity {
  @Field()
  provider: string

  @Field(() => Int)
  totalItems: number

  @Field(() => Int)
  successfulTransformations: number

  @Field(() => Int)
  failedTransformations: number

  @Field(() => Date, { nullable: true })
  lastProcessedAt?: Date
}

@ObjectType('ProcessorStats')
export class ProcessorStatsEntity {
  @Field(() => ID)
  jobId: string

  @Field(() => Int)
  totalItems: number

  @Field(() => Int)
  duplicatesSkipped: number

  @Field(() => Int)
  itemsStored: number

  @Field(() => Int)
  transformationErrors: number

  @Field(() => Date)
  lastProcessedAt: Date

  @Field(() => Float)
  successRate: number

  @Field(() => Float)
  duplicateRate: number
}

@ObjectType('BatchProcessingStats')
export class BatchProcessingStatsEntity {
  @Field(() => ID)
  jobId: string

  @Field(() => Int)
  totalBatches: number

  @Field(() => Int)
  completedBatches: number

  @Field(() => Int)
  failedBatches: number

  @Field(() => Int)
  activeBatches: number

  @Field(() => Int)
  waitingBatches: number

  @Field(() => Float)
  progress: number

  @Field(() => Int, { nullable: true })
  estimatedTimeRemaining?: number
}

@ObjectType('TransformationResult')
export class TransformationResultEntity {
  @Field()
  success: boolean

  @Field(() => GraphQLJSON, { nullable: true })
  data?: Record<string, any>

  @Field(() => [String], { nullable: true })
  errors?: string[]

  @Field(() => [String], { nullable: true })
  warnings?: string[]

  @Field(() => Int)
  processingTime: number
}

@ObjectType('DeduplicationResult')
export class DeduplicationResultEntity {
  @Field()
  isDuplicate: boolean

  @Field()
  deduplicationKey: string

  @Field(() => ScrapedItemEntity, { nullable: true })
  existingItem?: ScrapedItemEntity

  @Field(() => Date)
  checkedAt: Date
}
