import { InputType, Field } from '@nestjs/graphql'
import { IsEnum, IsOptional, IsDateString } from 'class-validator'
import { ScrapingProvider } from './create-job.input'
import { JobStatus } from './update-job.input'

@InputType()
export class JobFilterInput {
  @Field(() => ScrapingProvider, { nullable: true })
  @IsOptional()
  @IsEnum(ScrapingProvider)
  provider?: ScrapingProvider

  @Field(() => JobStatus, { nullable: true })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  createdAfter?: string

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  createdBefore?: string
}
