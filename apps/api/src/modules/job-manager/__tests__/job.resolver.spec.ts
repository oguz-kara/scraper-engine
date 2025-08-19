import { Test, TestingModule } from '@nestjs/testing'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { JobResolver } from '../resolvers/job.resolver'
import { JobService } from '../services/job.service'
import { CreateJobInput, ScrapingProvider } from '../dto/create-job.input'
import { JobFilterInput } from '../dto/job-filter.input'
import { JobPaginationInput } from '../dto/job-pagination.input'

describe('JobResolver', () => {
  let resolver: JobResolver
  let service: JobService
  let eventEmitter: EventEmitter2

  const mockJob = {
    id: 'test-job-id',
    provider: 'SHELL',
    status: 'PENDING',
    input: { searchTerms: ['test'] },
    currentInput: null,
    processedInput: null,
    remainingInput: null,
    configuration: null,
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

  const mockService = {
    createJob: jest.fn(),
    getJob: jest.fn(),
    getJobs: jest.fn(),
    startJob: jest.fn(),
    pauseJob: jest.fn(),
    resumeJob: jest.fn(),
    cancelJob: jest.fn(),
    retryJob: jest.fn(),
  }

  const mockEventEmitter = {
    on: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobResolver,
        {
          provide: JobService,
          useValue: mockService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile()

    resolver = module.get<JobResolver>(JobResolver)
    service = module.get<JobService>(JobService)
    eventEmitter = module.get<EventEmitter2>(EventEmitter2)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })

  describe('getJob', () => {
    it('should return a job entity', async () => {
      mockService.getJob.mockResolvedValue(mockJob)

      const result = await resolver.getJob(mockJob.id)

      expect(mockService.getJob).toHaveBeenCalledWith(mockJob.id)
      expect(result).toEqual(
        expect.objectContaining({
          id: mockJob.id,
          provider: mockJob.provider,
          status: mockJob.status,
        }),
      )
    })
  })

  describe('getJobs', () => {
    it('should return paginated jobs', async () => {
      const filter: JobFilterInput = { provider: ScrapingProvider.SHELL }
      const pagination: JobPaginationInput = { limit: 10, offset: 0 }
      const paginatedResult = {
        items: [mockJob],
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }

      mockService.getJobs.mockResolvedValue(paginatedResult)

      const result = await resolver.getJobs(filter, pagination)

      expect(mockService.getJobs).toHaveBeenCalledWith(filter, pagination)
      expect(result).toEqual({
        edges: [
          expect.objectContaining({
            id: mockJob.id,
            provider: mockJob.provider,
          }),
        ],
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      })
    })
  })

  describe('createJob', () => {
    it('should create and return a job entity', async () => {
      const input: CreateJobInput = {
        provider: ScrapingProvider.SHELL,
        input: { searchTerms: ['test'] },
      }

      mockService.createJob.mockResolvedValue(mockJob)

      const result = await resolver.createJob(input)

      expect(mockService.createJob).toHaveBeenCalledWith(input)
      expect(result).toEqual(
        expect.objectContaining({
          id: mockJob.id,
          provider: mockJob.provider,
        }),
      )
    })
  })

  describe('startJob', () => {
    it('should start and return a job entity', async () => {
      const runningJob = { ...mockJob, status: 'RUNNING', startedAt: new Date() }
      mockService.startJob.mockResolvedValue(runningJob)

      const result = await resolver.startJob(mockJob.id)

      expect(mockService.startJob).toHaveBeenCalledWith(mockJob.id)
      expect(result).toEqual(
        expect.objectContaining({
          id: mockJob.id,
          status: 'RUNNING',
        }),
      )
    })
  })

  describe('pauseJob', () => {
    it('should pause and return a job entity', async () => {
      const pausedJob = { ...mockJob, status: 'PAUSED', pausedAt: new Date() }
      mockService.pauseJob.mockResolvedValue(pausedJob)

      const result = await resolver.pauseJob(mockJob.id)

      expect(mockService.pauseJob).toHaveBeenCalledWith(mockJob.id)
      expect(result).toEqual(
        expect.objectContaining({
          id: mockJob.id,
          status: 'PAUSED',
        }),
      )
    })
  })

  describe('resumeJob', () => {
    it('should resume and return a job entity', async () => {
      const resumedJob = { ...mockJob, status: 'RUNNING', startedAt: new Date() }
      mockService.resumeJob.mockResolvedValue(resumedJob)

      const result = await resolver.resumeJob(mockJob.id)

      expect(mockService.resumeJob).toHaveBeenCalledWith(mockJob.id)
      expect(result).toEqual(
        expect.objectContaining({
          id: mockJob.id,
          status: 'RUNNING',
        }),
      )
    })
  })

  describe('cancelJob', () => {
    it('should cancel and return a job entity', async () => {
      const cancelledJob = { ...mockJob, status: 'CANCELLED', completedAt: new Date() }
      mockService.cancelJob.mockResolvedValue(cancelledJob)

      const result = await resolver.cancelJob(mockJob.id)

      expect(mockService.cancelJob).toHaveBeenCalledWith(mockJob.id)
      expect(result).toEqual(
        expect.objectContaining({
          id: mockJob.id,
          status: 'CANCELLED',
        }),
      )
    })
  })

  describe('retryJob', () => {
    it('should retry and return a job entity', async () => {
      const retriedJob = { ...mockJob, status: 'PENDING', retryCount: 1 }
      mockService.retryJob.mockResolvedValue(retriedJob)

      const result = await resolver.retryJob(mockJob.id)

      expect(mockService.retryJob).toHaveBeenCalledWith(mockJob.id)
      expect(result).toEqual(
        expect.objectContaining({
          id: mockJob.id,
          status: 'PENDING',
          retryCount: 1,
        }),
      )
    })
  })

  it('should setup event listeners on construction', () => {
    // Clear previous calls
    jest.clearAllMocks()

    // Create a new instance to trigger constructor
    const newResolver = new JobResolver(mockService as any, mockEventEmitter as any)

    expect(mockEventEmitter.on).toHaveBeenCalledWith('job.statusChanged', expect.any(Function))
    expect(mockEventEmitter.on).toHaveBeenCalledWith('job.progressUpdated', expect.any(Function))
    expect(mockEventEmitter.on).toHaveBeenCalledWith('job.completed', expect.any(Function))
    expect(mockEventEmitter.on).toHaveBeenCalledWith('job.failed', expect.any(Function))
    expect(mockEventEmitter.on).toHaveBeenCalledWith('job.created', expect.any(Function))
  })
})
