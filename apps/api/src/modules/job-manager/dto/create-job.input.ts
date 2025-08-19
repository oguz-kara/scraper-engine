import { InputType, Field, registerEnumType } from '@nestjs/graphql'
import { IsEnum, IsOptional, IsObject, ValidateNested, ArrayMaxSize, IsArray, IsUrl, IsString } from 'class-validator'
import { Type } from 'class-transformer'
import GraphQLJSON from 'graphql-type-json'

export enum ScrapingProvider {
  SHELL = 'SHELL',
  CASTROL = 'CASTROL',
  GOOGLE = 'GOOGLE',
  LINKEDIN = 'LINKEDIN',
}

registerEnumType(ScrapingProvider, {
  name: 'ScrapingProvider',
})

@InputType()
class JobInputDto {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  searchTerms?: string[]

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUrl({}, { each: true })
  urls?: string[]

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>
}

@InputType()
export class CreateJobInput {
  @Field(() => ScrapingProvider)
  @IsEnum(ScrapingProvider)
  provider: ScrapingProvider

  @Field(() => JobInputDto, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => JobInputDto)
  input?: JobInputDto

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>
}
