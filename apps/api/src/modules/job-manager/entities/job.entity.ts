import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { ScrapingProvider } from '../dto/create-job.input';
import { JobStatus } from '../dto/update-job.input';

@ObjectType('Job')
export class JobEntity {
  @Field(() => ID)
  id: string;

  @Field(() => ScrapingProvider)
  provider: ScrapingProvider;

  @Field(() => JobStatus)
  status: JobStatus;

  @Field(() => GraphQLJSON, { nullable: true })
  input?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  currentInput?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  processedInput?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  remainingInput?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  configuration?: any;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  startedAt?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  pausedAt?: Date;

  @Field({ nullable: true })
  failedAt?: Date;

  @Field(() => Int, { nullable: true })
  duration?: number;

  @Field(() => Int)
  itemsScraped: number;

  @Field(() => Float, { nullable: true })
  itemsPerSecond?: number;

  @Field(() => Float)
  progressPercentage: number;

  @Field({ nullable: true })
  errorMessage?: string;

  @Field({ nullable: true })
  errorCode?: string;

  @Field(() => Int)
  retryCount: number;

  @Field({ nullable: true })
  lastRetryAt?: Date;
}