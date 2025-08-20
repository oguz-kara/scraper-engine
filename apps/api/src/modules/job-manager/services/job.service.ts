import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectQueue } from '@nestjs/bull'
import type { Queue } from 'bull'
import { ScrapingJob } from '@prisma/client'
import { ConfigService } from '@nestjs/config'

import { JobRepository } from '../repositories/job.repository'
import { CreateJobInput } from '../dto/create-job.input'
import { JobFilterInput } from '../dto/job-filter.input'
import { JobPaginationInput } from '../dto/job-pagination.input'
import { JobStatus } from '../dto/update-job.input'
import {
  JobNotFoundException,
  InvalidStateTransitionException,
  JobAlreadyRunningException,
  JobCannotBePausedException,
  JobCannotBeResumedException,
  JobCannotBeCancelledException,
} from '../exceptions/job.exceptions'
import { JobProgress, PaginatedResult, JobFilter, PaginationParams } from '../interfaces/job-input.interface'
import { QueueJobData, JobEvents } from '../interfaces/job-events.interface'

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name)

  constructor(
    private readonly jobRepository: JobRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    @InjectQueue('scraper') private readonly scraperQueue: Queue,
  ) {}

  async createJob(input: CreateJobInput): Promise<ScrapingJob> {
    try {
      this.logger.log(`Creating job for provider ${input.provider}`)

      const jobData = {
        provider: input.provider,
        input: input.input,
        configuration: input.configuration,
      }

      const job = await this.jobRepository.create(jobData)

      this.eventEmitter.emit('job.created', {
        jobId: job.id,
        provider: job.provider,
      } as JobEvents['job.created'])

      this.logger.log(`Successfully created job ${job.id}`)
      return job
    } catch (error) {
      this.logger.error(`Failed to create job for provider ${input.provider}`, error.stack)
      throw error
    }
  }

  async getJob(id: string): Promise<ScrapingJob> {
    const job = await this.jobRepository.findById(id)
    if (!job) {
      throw new JobNotFoundException(id)
    }
    return job
  }

  async getJobs(filter?: JobFilterInput, pagination?: JobPaginationInput): Promise<PaginatedResult<ScrapingJob>> {
    const jobFilter: JobFilter = {}
    const paginationParams: PaginationParams = {
      limit: pagination?.limit || 20,
      offset: pagination?.offset || 0,
    }

    if (filter?.provider) {
      jobFilter.provider = filter.provider
    }
    if (filter?.status) {
      jobFilter.status = filter.status
    }
    if (filter?.createdAfter) {
      jobFilter.createdAfter = new Date(filter.createdAfter)
    }
    if (filter?.createdBefore) {
      jobFilter.createdBefore = new Date(filter.createdBefore)
    }

    return this.jobRepository.findMany(jobFilter, paginationParams)
  }

  async startJob(id: string): Promise<ScrapingJob> {
    const job = await this.getJob(id)

    if (job.status === 'RUNNING') {
      throw new JobAlreadyRunningException(id)
    }

    this.validateStateTransition(job.status as JobStatus, JobStatus.RUNNING)

    const updatedJob = await this.jobRepository.updateStatus(id, JobStatus.RUNNING, {
      startedAt: new Date(),
    })

    const queueJobData: QueueJobData = {
      jobId: id,
      provider: job.provider,
      attempt: job.retryCount + 1,
    }

    const jobPrefix = this.isSimulationMode() ? 'simulate' : 'scraper'
    await this.scraperQueue.add(`${jobPrefix}.${job.provider.toLowerCase()}`, queueJobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    })

    this.eventEmitter.emit('job.statusChanged', {
      jobId: id,
      oldStatus: job.status,
      newStatus: JobStatus.RUNNING,
    } as JobEvents['job.statusChanged'])

    this.logger.log(`Started job ${id}, added to queue`)
    return updatedJob
  }

  async pauseJob(id: string): Promise<ScrapingJob> {
    const job = await this.getJob(id)

    this.validateStateTransition(job.status as JobStatus, JobStatus.PAUSED)

    if (job.status !== 'RUNNING') {
      throw new JobCannotBePausedException(id, job.status as JobStatus)
    }

    const updatedJob = await this.jobRepository.updateStatus(id, JobStatus.PAUSED, {
      pausedAt: new Date(),
    })

    this.eventEmitter.emit('job.statusChanged', {
      jobId: id,
      oldStatus: job.status,
      newStatus: JobStatus.PAUSED,
    } as JobEvents['job.statusChanged'])

    this.logger.log(`Paused job ${id}`)
    return updatedJob
  }

  async resumeJob(id: string): Promise<ScrapingJob> {
    const job = await this.getJob(id)

    this.validateStateTransition(job.status as JobStatus, JobStatus.RUNNING)

    if (job.status !== 'PAUSED') {
      throw new JobCannotBeResumedException(id, job.status as JobStatus)
    }

    const updatedJob = await this.jobRepository.updateStatus(id, JobStatus.RUNNING, {
      startedAt: job.startedAt || new Date(),
      pausedAt: undefined,
    })

    const queueJobData: QueueJobData = {
      jobId: id,
      provider: job.provider,
      attempt: job.retryCount + 1,
    }

    const jobPrefix = this.isSimulationMode() ? 'simulate' : 'scraper'
    await this.scraperQueue.add(`${jobPrefix}.${job.provider.toLowerCase()}`, queueJobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    })

    this.eventEmitter.emit('job.statusChanged', {
      jobId: id,
      oldStatus: job.status,
      newStatus: JobStatus.RUNNING,
    } as JobEvents['job.statusChanged'])

    this.logger.log(`Resumed job ${id}`)
    return updatedJob
  }

  async cancelJob(id: string): Promise<ScrapingJob> {
    const job = await this.getJob(id)

    this.validateStateTransition(job.status as JobStatus, JobStatus.CANCELLED)

    if (['COMPLETED', 'CANCELLED'].includes(job.status)) {
      throw new JobCannotBeCancelledException(id, job.status as JobStatus)
    }

    const updatedJob = await this.jobRepository.updateStatus(id, JobStatus.CANCELLED, {
      completedAt: new Date(),
      duration: job.startedAt ? Date.now() - job.startedAt.getTime() : 0,
    })

    this.eventEmitter.emit('job.statusChanged', {
      jobId: id,
      oldStatus: job.status,
      newStatus: JobStatus.CANCELLED,
    } as JobEvents['job.statusChanged'])

    this.logger.log(`Cancelled job ${id}`)
    return updatedJob
  }

  async retryJob(id: string): Promise<ScrapingJob> {
    const job = await this.getJob(id)

    if (job.status !== 'FAILED') {
      throw new InvalidStateTransitionException(id, job.status as JobStatus, JobStatus.PENDING)
    }

    await this.jobRepository.incrementRetryCount(id)

    const updatedJob = await this.jobRepository.updateStatus(id, JobStatus.PENDING, {
      errorMessage: undefined,
      errorCode: undefined,
      failedAt: undefined,
    })

    this.eventEmitter.emit('job.statusChanged', {
      jobId: id,
      oldStatus: job.status,
      newStatus: JobStatus.PENDING,
    } as JobEvents['job.statusChanged'])

    this.logger.log(`Retrying job ${id}, attempt ${updatedJob.retryCount}`)
    return updatedJob
  }

  async completeJob(id: string, itemsScraped: number): Promise<ScrapingJob> {
    const job = await this.getJob(id)

    const completedAt = new Date()
    const duration = job.startedAt ? completedAt.getTime() - job.startedAt.getTime() : 0

    const updatedJob = await this.jobRepository.updateStatus(id, JobStatus.COMPLETED, {
      completedAt,
      duration,
      itemsScraped,
      progressPercentage: 100,
    })

    this.eventEmitter.emit('job.statusChanged', {
      jobId: id,
      oldStatus: job.status,
      newStatus: JobStatus.COMPLETED,
    } as JobEvents['job.statusChanged'])

    this.eventEmitter.emit('job.completed', {
      jobId: id,
      itemsScraped,
      duration,
    } as JobEvents['job.completed'])

    this.logger.log(`Completed job ${id} with ${itemsScraped} items scraped`)
    return updatedJob
  }

  async failJob(id: string, error: Error): Promise<ScrapingJob> {
    const job = await this.getJob(id)

    const failedAt = new Date()
    const duration = job.startedAt ? failedAt.getTime() - job.startedAt.getTime() : 0

    const updatedJob = await this.jobRepository.updateStatus(id, JobStatus.FAILED, {
      failedAt,
      duration,
      errorMessage: error.message,
      errorCode: error.name,
    })

    this.eventEmitter.emit('job.statusChanged', {
      jobId: id,
      oldStatus: job.status,
      newStatus: JobStatus.FAILED,
    } as JobEvents['job.statusChanged'])

    this.eventEmitter.emit('job.failed', {
      jobId: id,
      error: error.message,
      errorCode: error.name,
    } as JobEvents['job.failed'])

    this.logger.error(`Failed job ${id}: ${error.message}`)
    return updatedJob
  }

  async updateProgress(id: string, progress: JobProgress): Promise<ScrapingJob> {
    const job = await this.jobRepository.updateProgress(id, progress)

    this.eventEmitter.emit('job.progressUpdated', {
      jobId: id,
      percentage: progress.progressPercentage,
      itemsScraped: progress.itemsScraped,
    } as JobEvents['job.progressUpdated'])

    return job
  }

  private validateStateTransition(currentStatus: JobStatus, newStatus: JobStatus): void {
    const validTransitions: Record<JobStatus, JobStatus[]> = {
      [JobStatus.PENDING]: [JobStatus.RUNNING, JobStatus.CANCELLED],
      [JobStatus.RUNNING]: [JobStatus.PAUSED, JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED],
      [JobStatus.PAUSED]: [JobStatus.RUNNING, JobStatus.CANCELLED],
      [JobStatus.COMPLETED]: [], // terminal state
      [JobStatus.FAILED]: [JobStatus.PENDING, JobStatus.CANCELLED], // retry or cancel
      [JobStatus.CANCELLED]: [], // terminal state
    }

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new InvalidStateTransitionException('', currentStatus, newStatus)
    }
  }

  private calculateProgress(job: ScrapingJob): number {
    if (!job.input || !job.processedInput) {
      return 0
    }

    try {
      const totalInputLength = this.getInputLength(job.input)
      const processedInputLength = this.getInputLength(job.processedInput)

      if (totalInputLength === 0) {
        return 0
      }

      return Math.round((processedInputLength / totalInputLength) * 100)
    } catch (error) {
      this.logger.warn(`Failed to calculate progress for job ${job.id}`, error.message)
      return job.progressPercentage
    }
  }

  private isSimulationMode(): boolean {
    const raw = this.configService.get<string>('SCRAPER_SIMULATION_MODE', 'false')
    return raw === 'true' || raw === '1'
  }

  private getInputLength(input: any): number {
    if (!input) return 0

    let totalLength = 0
    if (input.searchTerms?.length) totalLength += input.searchTerms.length
    if (input.urls?.length) totalLength += input.urls.length

    return totalLength
  }
}
