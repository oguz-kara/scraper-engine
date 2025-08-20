import { InputType, Field, ID, Int } from '@nestjs/graphql'
import { GraphQLJSON } from 'graphql-type-json'
import { IsString, IsNotEmpty, IsOptional, IsObject, IsUrl } from 'class-validator'

@InputType()
export class CreateScrapedItemInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  jobId: string

  @Field()
  @IsString()
  @IsNotEmpty()
  provider: string

  @Field()
  @IsString()
  @IsNotEmpty()
  rawHtml: string

  @Field(() => GraphQLJSON)
  @IsObject()
  normalizedData: Record<string, any>

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>
}

@InputType()
export class ProcessItemDirectlyInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  jobId: string

  @Field()
  @IsString()
  @IsNotEmpty()
  provider: string

  @Field()
  @IsString()
  @IsNotEmpty()
  rawHtml: string

  @Field(() => GraphQLJSON)
  @IsObject()
  normalizedData: Record<string, any>

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>
}

@InputType()
export class GetScrapedItemsInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  jobId: string

  @Field(() => Int, { nullable: true, defaultValue: 100 })
  @IsOptional()
  limit?: number

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  offset?: number

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  provider?: string
}

@InputType()
export class TestTransformationInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  provider: string

  @Field(() => GraphQLJSON)
  @IsObject()
  testData: Record<string, any>
}

@InputType()
export class TestDeduplicationInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  provider: string

  @Field(() => GraphQLJSON)
  @IsObject()
  itemData: Record<string, any>

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sourceUrl?: string
}

@InputType()
export class UpdateProcessorConfigInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  batchSize?: number

  @Field(() => Int, { nullable: true })
  @IsOptional()
  batchTimeoutMs?: number

  @Field(() => Int, { nullable: true })
  @IsOptional()
  maxRetries?: number

  @Field(() => Int, { nullable: true })
  @IsOptional()
  retryDelayMs?: number

  @Field({ nullable: true })
  @IsOptional()
  enableDeduplication?: boolean

  @Field({ nullable: true })
  @IsOptional()
  enableTransformation?: boolean

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  storageOptions?: Record<string, any>
}