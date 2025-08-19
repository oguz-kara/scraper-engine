import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

@InputType()
export class JobPaginationInput {
  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}