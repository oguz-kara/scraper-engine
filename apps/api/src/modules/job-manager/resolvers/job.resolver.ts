import { Resolver, Query, Mutation, Args, Subscription, ID } from '@nestjs/graphql'
import { Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { PubSub } from 'graphql-subscriptions'

import { JobService } from '../services/job.service'
import { JobEntity } from '../entities/job.entity'
import { JobProgressEntity, JobConnectionEntity } from '../entities/job-progress.entity'
import { CreateJobInput } from '../dto/create-job.input'
import { JobFilterInput } from '../dto/job-filter.input'
import { JobPaginationInput } from '../dto/job-pagination.input'

const pubSub = new PubSub() as any

function getAsyncIterator(trigger: string) {
  const method = pubSub.asyncIterator || pubSub.asyncIterableIterator
  if (typeof method !== 'function') {
    throw new Error('PubSub does not expose an async iterator method')
  }
  return method.call(pubSub, trigger)
}

@Resolver(() => JobEntity)
export class JobResolver {
  private readonly logger = new Logger(JobResolver.name)

  constructor(
    private readonly jobService: JobService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.setupEventListeners()
  }

  @Query(() => JobEntity, { name: 'job' })
  async getJob(@Args('id', { type: () => ID }) id: string): Promise<JobEntity> {
    this.logger.log(`Fetching job ${id}`)
    const job = await this.jobService.getJob(id)
    return this.mapToEntity(job)
  }

  @Query(() => JobConnectionEntity, { name: 'jobs' })
  async getJobs(
    @Args('filter', { type: () => JobFilterInput, nullable: true }) filter?: JobFilterInput,
    @Args('pagination', { type: () => JobPaginationInput, nullable: true }) pagination?: JobPaginationInput,
  ): Promise<JobConnectionEntity> {
    this.logger.log('Fetching jobs with filter and pagination')

    const result = await this.jobService.getJobs(filter, pagination)

    return {
      edges: result.items.map(job => this.mapToEntity(job)),
      totalCount: result.totalCount,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    }
  }

  @Mutation(() => JobEntity, { name: 'createJob' })
  async createJob(@Args('input') input: CreateJobInput): Promise<JobEntity> {
    this.logger.log(`Creating job for provider ${input.provider}`)
    const job = await this.jobService.createJob(input)
    return this.mapToEntity(job)
  }

  @Mutation(() => JobEntity, { name: 'startJob' })
  async startJob(@Args('id', { type: () => ID }) id: string): Promise<JobEntity> {
    this.logger.log(`Starting job ${id}`)
    const job = await this.jobService.startJob(id)
    return this.mapToEntity(job)
  }

  @Mutation(() => JobEntity, { name: 'pauseJob' })
  async pauseJob(@Args('id', { type: () => ID }) id: string): Promise<JobEntity> {
    this.logger.log(`Pausing job ${id}`)
    const job = await this.jobService.pauseJob(id)
    return this.mapToEntity(job)
  }

  @Mutation(() => JobEntity, { name: 'resumeJob' })
  async resumeJob(@Args('id', { type: () => ID }) id: string): Promise<JobEntity> {
    this.logger.log(`Resuming job ${id}`)
    const job = await this.jobService.resumeJob(id)
    return this.mapToEntity(job)
  }

  @Mutation(() => JobEntity, { name: 'cancelJob' })
  async cancelJob(@Args('id', { type: () => ID }) id: string): Promise<JobEntity> {
    this.logger.log(`Cancelling job ${id}`)
    const job = await this.jobService.cancelJob(id)
    return this.mapToEntity(job)
  }

  @Mutation(() => JobEntity, { name: 'retryJob' })
  async retryJob(@Args('id', { type: () => ID }) id: string): Promise<JobEntity> {
    this.logger.log(`Retrying job ${id}`)
    const job = await this.jobService.retryJob(id)
    return this.mapToEntity(job)
  }

  @Subscription(() => JobEntity, {
    name: 'jobStatusChanged',
    filter: (payload, variables) => {
      return variables.jobId ? payload.jobId === variables.jobId : true
    },
  })
  jobStatusChanged(@Args('jobId', { type: () => ID, nullable: true }) _jobId?: string) {
    return getAsyncIterator('jobStatusChanged')
  }

  @Subscription(() => JobProgressEntity, {
    name: 'jobProgressUpdated',
    filter: (payload, variables) => {
      return variables.jobId ? payload.jobId === variables.jobId : true
    },
  })
  jobProgressUpdated(@Args('jobId', { type: () => ID, nullable: true }) _jobId?: string) {
    return getAsyncIterator('jobProgressUpdated')
  }

  private mapToEntity(job: any): JobEntity {
    return {
      id: job.id,
      provider: job.provider,
      status: job.status,
      input: job.input,
      currentInput: job.currentInput,
      processedInput: job.processedInput,
      remainingInput: job.remainingInput,
      configuration: job.configuration,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      pausedAt: job.pausedAt,
      failedAt: job.failedAt,
      duration: job.duration,
      itemsScraped: job.itemsScraped,
      itemsPerSecond: job.itemsPerSecond,
      progressPercentage: job.progressPercentage,
      errorMessage: job.errorMessage,
      errorCode: job.errorCode,
      retryCount: job.retryCount,
      lastRetryAt: job.lastRetryAt,
    }
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('job.statusChanged', payload => {
      this.logger.log(`Job status changed: ${payload.jobId} from ${payload.oldStatus} to ${payload.newStatus}`)
      this.jobService
        .getJob(String(payload.jobId))
        .then(job => {
          pubSub.publish('jobStatusChanged', {
            jobId: payload.jobId,
            jobStatusChanged: this.mapToEntity(job),
          })
        })
        .catch(error => {
          this.logger.error(`Failed to publish jobStatusChanged for ${payload.jobId}`, error?.stack || String(error))
        })
    })

    this.eventEmitter.on('job.progressUpdated', payload => {
      this.logger.log(`Job progress updated: ${payload.jobId} - ${payload.percentage}%`)
      pubSub.publish('jobProgressUpdated', {
        jobId: payload.jobId,
        jobProgressUpdated: {
          jobId: payload.jobId,
          percentage: payload.percentage,
          itemsScraped: payload.itemsScraped,
          timestamp: new Date(),
        },
      })
    })

    this.eventEmitter.on('job.completed', payload => {
      this.logger.log(`Job completed: ${payload.jobId} with ${payload.itemsScraped} items`)
      this.jobService
        .getJob(String(payload.jobId))
        .then(job => {
          pubSub.publish('jobStatusChanged', {
            jobId: payload.jobId,
            jobStatusChanged: this.mapToEntity(job),
          })
        })
        .catch(error => {
          this.logger.error(
            `Failed to publish jobStatusChanged (completed) for ${payload.jobId}`,
            error?.stack || String(error),
          )
        })
    })

    this.eventEmitter.on('job.failed', payload => {
      this.logger.log(`Job failed: ${payload.jobId} - ${payload.error}`)
      this.jobService
        .getJob(String(payload.jobId))
        .then(job => {
          pubSub.publish('jobStatusChanged', {
            jobId: payload.jobId,
            jobStatusChanged: this.mapToEntity(job),
          })
        })
        .catch(error => {
          this.logger.error(
            `Failed to publish jobStatusChanged (failed) for ${payload.jobId}`,
            error?.stack || String(error),
          )
        })
    })

    this.eventEmitter.on('job.created', payload => {
      this.logger.log(`Job created: ${payload.jobId} for provider ${payload.provider}`)
    })
  }
}
