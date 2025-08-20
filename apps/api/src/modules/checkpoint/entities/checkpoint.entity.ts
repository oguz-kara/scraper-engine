import { ObjectType, Field, ID, Int } from '@nestjs/graphql'
import { GraphQLJSON } from 'graphql-type-json'

@ObjectType('Checkpoint')
export class CheckpointEntity {
  @Field(() => ID)
  id: string

  @Field(() => ID)
  jobId: string

  @Field(() => Int)
  sequenceNumber: number

  @Field(() => Int)
  itemsScraped: number

  @Field(() => GraphQLJSON)
  state: any

  @Field(() => GraphQLJSON, { nullable: true })
  browserState?: any

  @Field(() => Date)
  createdAt: Date
}

@ObjectType('CheckpointStats')
export class CheckpointStatsEntity {
  @Field(() => Int)
  total: number

  @Field(() => CheckpointEntity, { nullable: true })
  latest?: CheckpointEntity
}

@ObjectType('CheckpointProgress')
export class CheckpointProgressEntity {
  @Field(() => Int)
  currentSearchTermIndex: number

  @Field(() => Int)
  currentResultIndex: number

  @Field(() => Int)
  totalSearchTerms: number

  @Field(() => [String])
  processedSearchTerms: string[]

  @Field(() => [String])
  remainingSearchTerms: string[]

  @Field(() => Int)
  itemsScraped: number
}
