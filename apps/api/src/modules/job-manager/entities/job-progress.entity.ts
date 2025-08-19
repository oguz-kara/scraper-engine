import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

@ObjectType('JobProgress')
export class JobProgressEntity {
  @Field(() => ID)
  jobId: string;

  @Field(() => Float)
  percentage: number;

  @Field(() => Int)
  itemsScraped: number;

  @Field(() => Float, { nullable: true })
  itemsPerSecond?: number;

  @Field()
  timestamp: Date;
}

@ObjectType('JobConnection')
export class JobConnectionEntity {
  @Field(() => [JobEntity])
  edges: JobEntity[];

  @Field(() => Int)
  totalCount: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}

import { JobEntity } from './job.entity';