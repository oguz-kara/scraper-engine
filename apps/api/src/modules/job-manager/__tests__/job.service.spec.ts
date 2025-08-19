import { Test, TestingModule } from '@nestjs/testing'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { getQueueToken } from '@nestjs/bull'

import { JobService } from '../services/job.service'
import { JobRepository } from '../repositories/job.repository'
import { CreateJobInput, ScrapingProvider } from '../dto/create-job.input'
import { JobStatus } from '../dto/update-job.input'
import {
  JobNotFoundException,
  InvalidStateTransitionException,
  JobAlreadyRunningException,
} from '../exceptions/job.exceptions'

describe('JobService', () => {
  let service: JobService
  let repository: JobRepository
  let eventEmitter: EventEmitter2
  let queue: any

  const mockJob = {
    id: 'test-job-id',
    provider: 'SHELL',
    status: 'PENDING',
    input: { searchTerms: ['test'] },
    configuration: {},
    createdAt: new Date(),
    startedAt: null,
    completedAt: null,
    pausedAt: null,
    failedAt: null,
    duration: null,
    itemsScraped: 0,
    itemsPerSecond: null,
    progressPercentage: 0,
    errorMessage: null,
    errorCode: null,
    retryCount: 0,
    lastRetryAt: null,
  }

  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    updateProgress: jest.fn(),
    incrementRetryCount: jest.fn(),
  }

  const mockEventEmitter = {
    emit: jest.fn(),
  }

  const mockQueue = {
    add: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: JobRepository,
          useValue: mockRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: getQueueToken('scraper'),
          useValue: mockQueue,
        },
      ],
    }).compile()

    service = module.get<JobService>(JobService)
    repository = module.get<JobRepository>(JobRepository)
    eventEmitter = module.get<EventEmitter2>(EventEmitter2)
    queue = module.get(getQueueToken('scraper'))

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createJob', () => {
    it('should create a job successfully', async () => {
      const input: CreateJobInput = {
        provider: ScrapingProvider.SHELL,
        input: { searchTerms: ['test'] },
      }

      mockRepository.create.mockResolvedValue(mockJob)

      const result = await service.createJob(input)

      expect(mockRepository.create).toHaveBeenCalledWith({
        provider: ScrapingProvider.SHELL,
        input: { searchTerms: ['test'] },
        configuration: undefined,
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('job.created', {
        jobId: mockJob.id,
        provider: mockJob.provider,
      })
      expect(result).toEqual(mockJob)
    })
  })

  describe('getJob', () => {
    it('should return a job when found', async () => {
      mockRepository.findById.mockResolvedValue(mockJob)

      const result = await service.getJob(mockJob.id)

      expect(mockRepository.findById).toHaveBeenCalledWith(mockJob.id)
      expect(result).toEqual(mockJob)
    })

    it('should throw JobNotFoundException when job not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.getJob('non-existent-id')).rejects.toThrow(JobNotFoundException)
    })
  })

  describe('startJob', () => {
    it('should start a pending job successfully', async () => {
      const startedJob = { ...mockJob, status: 'RUNNING', startedAt: new Date() }

      mockRepository.findById.mockResolvedValue(mockJob)
      mockRepository.updateStatus.mockResolvedValue(startedJob)

      const result = await service.startJob(mockJob.id)

      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        mockJob.id,
        JobStatus.RUNNING,
        expect.objectContaining({ startedAt: expect.any(Date) }),
      )
      expect(mockQueue.add).toHaveBeenCalledWith(
        'scraper.shell',
        {
          jobId: mockJob.id,
          provider: mockJob.provider,
          attempt: 1,
        },
        expect.any(Object),
      )
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('job.statusChanged', {
        jobId: mockJob.id,
        oldStatus: 'PENDING',
        newStatus: JobStatus.RUNNING,
      })
    })

    it('should throw JobAlreadyRunningException when job is already running', async () => {
      const runningJob = { ...mockJob, status: 'RUNNING' }
      mockRepository.findById.mockResolvedValue(runningJob)

      await expect(service.startJob(mockJob.id)).rejects.toThrow(JobAlreadyRunningException)
    })
  })

  describe('pauseJob', () => {
    it('should pause a running job successfully', async () => {
      const runningJob = { ...mockJob, status: 'RUNNING' }
      const pausedJob = { ...mockJob, status: 'PAUSED', pausedAt: new Date() }

      mockRepository.findById.mockResolvedValue(runningJob)
      mockRepository.updateStatus.mockResolvedValue(pausedJob)

      const result = await service.pauseJob(mockJob.id)

      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        mockJob.id,
        JobStatus.PAUSED,
        expect.objectContaining({ pausedAt: expect.any(Date) }),
      )
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('job.statusChanged', {
        jobId: mockJob.id,
        oldStatus: 'RUNNING',
        newStatus: JobStatus.PAUSED,
      })
    })
  })

  describe('cancelJob', () => {
    it('should cancel a job successfully', async () => {
      const cancelledJob = {
        ...mockJob,
        status: 'CANCELLED',
        completedAt: new Date(),
        duration: 1000,
      }

      mockRepository.findById.mockResolvedValue(mockJob)
      mockRepository.updateStatus.mockResolvedValue(cancelledJob)

      const result = await service.cancelJob(mockJob.id)

      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        mockJob.id,
        JobStatus.CANCELLED,
        expect.objectContaining({
          completedAt: expect.any(Date),
          duration: expect.any(Number),
        }),
      )
    })
  })

  describe('completeJob', () => {
    it('should complete a job successfully', async () => {
      const completedJob = {
        ...mockJob,
        status: 'COMPLETED',
        completedAt: new Date(),
        duration: 5000,
        itemsScraped: 100,
        progressPercentage: 100,
      }

      mockRepository.findById.mockResolvedValue(mockJob)
      mockRepository.updateStatus.mockResolvedValue(completedJob)

      const result = await service.completeJob(mockJob.id, 100)

      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        mockJob.id,
        JobStatus.COMPLETED,
        expect.objectContaining({
          completedAt: expect.any(Date),
          duration: expect.any(Number),
          itemsScraped: 100,
          progressPercentage: 100,
        }),
      )
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('job.completed', {
        jobId: mockJob.id,
        itemsScraped: 100,
        duration: expect.any(Number),
      })
    })
  })

  describe('failJob', () => {
    it('should fail a job successfully', async () => {
      const error = new Error('Test error')
      const failedJob = {
        ...mockJob,
        status: 'FAILED',
        failedAt: new Date(),
        duration: 3000,
        errorMessage: error.message,
        errorCode: error.name,
      }

      mockRepository.findById.mockResolvedValue(mockJob)
      mockRepository.updateStatus.mockResolvedValue(failedJob)

      const result = await service.failJob(mockJob.id, error)

      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        mockJob.id,
        JobStatus.FAILED,
        expect.objectContaining({
          failedAt: expect.any(Date),
          duration: expect.any(Number),
          errorMessage: error.message,
          errorCode: error.name,
        }),
      )
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('job.failed', {
        jobId: mockJob.id,
        error: error.message,
        errorCode: error.name,
      })
    })
  })

  describe('retryJob', () => {
    it('should retry a failed job successfully', async () => {
      const failedJob = { ...mockJob, status: 'FAILED', retryCount: 1 }
      const pendingJob = { ...mockJob, status: 'PENDING', retryCount: 2 }

      mockRepository.findById.mockResolvedValue(failedJob)
      mockRepository.incrementRetryCount.mockResolvedValue({ ...failedJob, retryCount: 2 })
      mockRepository.updateStatus.mockResolvedValue(pendingJob)

      const result = await service.retryJob(mockJob.id)

      expect(mockRepository.incrementRetryCount).toHaveBeenCalledWith(mockJob.id)
      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        mockJob.id,
        JobStatus.PENDING,
        expect.objectContaining({
          errorMessage: undefined,
          errorCode: undefined,
          failedAt: undefined,
        }),
      )
    })

    it('should throw InvalidStateTransitionException for non-failed job', async () => {
      mockRepository.findById.mockResolvedValue(mockJob)

      await expect(service.retryJob(mockJob.id)).rejects.toThrow(InvalidStateTransitionException)
    })
  })
})
