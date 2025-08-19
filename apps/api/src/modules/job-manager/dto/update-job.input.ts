import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsObject, IsNumber, IsString, Min, Max } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';
import { ScrapingProvider } from './create-job.input';

export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(JobStatus, {
  name: 'JobStatus',
});

@InputType()
export class UpdateJobInput {
  @Field(() => JobStatus, { nullable: true })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  input?: Record<string, any>;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  itemsScraped?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  errorCode?: string;
}