import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../common/database/prisma.service'
import { ScrapingJob } from '@prisma/client'
import {
  CreateJobData,
  UpdateJobData,
  JobMetadata,
  JobProgress,
  PaginationParams,
  JobFilter,
  PaginatedResult,
} from '../interfaces/job-input.interface'

@Injectable()
export class JobRepository {
  private readonly logger = new Logger(JobRepository.name)

  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateJobData): Promise<ScrapingJob> {
    try {
      const job = await this.prisma.scrapingJob.create({
        data: {
          provider: data.provider as any,
          input: data.input || undefined,
          currentInput: data.input || undefined,
          remainingInput: data.input || undefined,
          configuration: data.configuration || undefined,
          status: 'PENDING',
          progressPercentage: 0,
          itemsScraped: 0,
          retryCount: 0,
        },
      })

      this.logger.log(`Created job ${job.id} for provider ${job.provider}`)
      return job
    } catch (error) {
      this.logger.error(`Failed to create job for provider ${data.provider}`, error.stack)
      throw error
    }
  }

  async findById(id: string): Promise<ScrapingJob | null> {
    try {
      return await this.prisma.scrapingJob.findUnique({
        where: { id },
      })
    } catch (error) {
      this.logger.error(`Failed to find job ${id}`, error.stack)
      throw error
    }
  }

  async findMany(filter: JobFilter, pagination: PaginationParams): Promise<PaginatedResult<ScrapingJob>> {
    try {
      const where: any = {}

      if (filter.provider) {
        where.provider = filter.provider
      }

      if (filter.status) {
        where.status = filter.status
      }

      if (filter.createdAfter || filter.createdBefore) {
        where.createdAt = {}
        if (filter.createdAfter) {
          where.createdAt.gte = filter.createdAfter
        }
        if (filter.createdBefore) {
          where.createdAt.lte = filter.createdBefore
        }
      }

      const [items, totalCount] = await Promise.all([
        this.prisma.scrapingJob.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: pagination.offset,
          take: pagination.limit,
        }),
        this.prisma.scrapingJob.count({ where }),
      ])

      const hasNextPage = pagination.offset + pagination.limit < totalCount
      const hasPreviousPage = pagination.offset > 0

      return {
        items,
        totalCount,
        hasNextPage,
        hasPreviousPage,
      }
    } catch (error) {
      this.logger.error('Failed to find jobs', error.stack)
      throw error
    }
  }

  async update(id: string, data: UpdateJobData): Promise<ScrapingJob> {
    try {
      const job = await this.prisma.scrapingJob.update({
        where: { id },
        data: data as any,
      })

      this.logger.log(`Updated job ${id}`)
      return job
    } catch (error) {
      this.logger.error(`Failed to update job ${id}`, error.stack)
      throw error
    }
  }

  async updateStatus(id: string, status: string, metadata?: JobMetadata): Promise<ScrapingJob> {
    try {
      const updateData: any = { status }

      if (metadata) {
        Object.assign(updateData, metadata)
      }

      const job = await this.prisma.scrapingJob.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Updated job ${id} status to ${status}`)
      return job
    } catch (error) {
      this.logger.error(`Failed to update job ${id} status to ${status}`, error.stack)
      throw error
    }
  }

  async updateProgress(id: string, progress: JobProgress): Promise<ScrapingJob> {
    try {
      const updateData: any = {
        itemsScraped: progress.itemsScraped,
        progressPercentage: progress.progressPercentage,
      }

      if (progress.itemsPerSecond !== undefined) {
        updateData.itemsPerSecond = progress.itemsPerSecond
      }

      if (progress.currentInput) {
        updateData.currentInput = progress.currentInput
      }

      if (progress.processedInput) {
        updateData.processedInput = progress.processedInput
      }

      if (progress.remainingInput) {
        updateData.remainingInput = progress.remainingInput
      }

      const job = await this.prisma.scrapingJob.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Updated job ${id} progress to ${progress.progressPercentage}%`)
      return job
    } catch (error) {
      this.logger.error(`Failed to update job ${id} progress`, error.stack)
      throw error
    }
  }

  async incrementRetryCount(id: string): Promise<ScrapingJob> {
    try {
      const job = await this.prisma.scrapingJob.update({
        where: { id },
        data: {
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
        },
      })

      this.logger.log(`Incremented retry count for job ${id} to ${job.retryCount}`)
      return job
    } catch (error) {
      this.logger.error(`Failed to increment retry count for job ${id}`, error.stack)
      throw error
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      await this.prisma.scrapingJob.delete({
        where: { id },
      })

      this.logger.log(`Deleted job ${id}`)
    } catch (error) {
      this.logger.error(`Failed to delete job ${id}`, error.stack)
      throw error
    }
  }

  async countByStatus(status: string): Promise<number> {
    try {
      return await this.prisma.scrapingJob.count({
        where: { status: status as any },
      })
    } catch (error) {
      this.logger.error(`Failed to count jobs by status ${status}`, error.stack)
      throw error
    }
  }

  async findByStatus(status: string): Promise<ScrapingJob[]> {
    try {
      return await this.prisma.scrapingJob.findMany({
        where: { status: status as any },
        orderBy: { createdAt: 'asc' },
      })
    } catch (error) {
      this.logger.error(`Failed to find jobs by status ${status}`, error.stack)
      throw error
    }
  }
}
