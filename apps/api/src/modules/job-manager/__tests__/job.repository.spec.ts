import { Test, TestingModule } from '@nestjs/testing'
import { JobRepository } from '../repositories/job.repository'
import { PrismaService } from '../../../common/database/prisma.service'

describe('JobRepository', () => {
  let repository: JobRepository
  let prismaService: PrismaService

  const mockJob = {
    id: 'test-job-id',
    provider: 'SHELL',
    status: 'PENDING',
    input: { searchTerms: ['test'] },
    currentInput: { searchTerms: ['test'] },
    processedInput: null,
    remainingInput: { searchTerms: ['test'] },
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

  const mockPrismaService = {
    scrapingJob: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    repository = module.get<JobRepository>(JobRepository)
    prismaService = module.get<PrismaService>(PrismaService)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(repository).toBeDefined()
  })

  describe('create', () => {
    it('should create a job successfully', async () => {
      const createData = {
        provider: 'SHELL',
        input: { searchTerms: ['test'] },
        configuration: {},
      }

      mockPrismaService.scrapingJob.create.mockResolvedValue(mockJob)

      const result = await repository.create(createData)

      expect(mockPrismaService.scrapingJob.create).toHaveBeenCalledWith({
        data: {
          provider: 'SHELL',
          input: { searchTerms: ['test'] },
          currentInput: { searchTerms: ['test'] },
          remainingInput: { searchTerms: ['test'] },
          configuration: {},
          status: 'PENDING',
          progressPercentage: 0,
          itemsScraped: 0,
          retryCount: 0,
        },
      })
      expect(result).toEqual(mockJob)
    })
  })

  describe('findById', () => {
    it('should find a job by id', async () => {
      mockPrismaService.scrapingJob.findUnique.mockResolvedValue(mockJob)

      const result = await repository.findById(mockJob.id)

      expect(mockPrismaService.scrapingJob.findUnique).toHaveBeenCalledWith({
        where: { id: mockJob.id },
      })
      expect(result).toEqual(mockJob)
    })

    it('should return null when job not found', async () => {
      mockPrismaService.scrapingJob.findUnique.mockResolvedValue(null)

      const result = await repository.findById('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('findMany', () => {
    it('should find jobs with filter and pagination', async () => {
      const jobs = [mockJob]
      const filter = { provider: 'SHELL', status: 'PENDING' }
      const pagination = { limit: 10, offset: 0 }

      mockPrismaService.scrapingJob.findMany.mockResolvedValue(jobs)
      mockPrismaService.scrapingJob.count.mockResolvedValue(1)

      const result = await repository.findMany(filter, pagination)

      expect(mockPrismaService.scrapingJob.findMany).toHaveBeenCalledWith({
        where: {
          provider: 'SHELL',
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
      expect(result).toEqual({
        items: jobs,
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      })
    })
  })

  describe('updateStatus', () => {
    it('should update job status successfully', async () => {
      const updatedJob = { ...mockJob, status: 'RUNNING', startedAt: new Date() }
      const metadata = { startedAt: new Date() }

      mockPrismaService.scrapingJob.update.mockResolvedValue(updatedJob)

      const result = await repository.updateStatus(mockJob.id, 'RUNNING', metadata)

      expect(mockPrismaService.scrapingJob.update).toHaveBeenCalledWith({
        where: { id: mockJob.id },
        data: {
          status: 'RUNNING',
          startedAt: metadata.startedAt,
        },
      })
      expect(result).toEqual(updatedJob)
    })
  })

  describe('updateProgress', () => {
    it('should update job progress successfully', async () => {
      const updatedJob = { ...mockJob, itemsScraped: 50, progressPercentage: 50 }
      const progress = {
        itemsScraped: 50,
        progressPercentage: 50,
        itemsPerSecond: 5.5,
      }

      mockPrismaService.scrapingJob.update.mockResolvedValue(updatedJob)

      const result = await repository.updateProgress(mockJob.id, progress)

      expect(mockPrismaService.scrapingJob.update).toHaveBeenCalledWith({
        where: { id: mockJob.id },
        data: {
          itemsScraped: 50,
          progressPercentage: 50,
          itemsPerSecond: 5.5,
        },
      })
      expect(result).toEqual(updatedJob)
    })
  })

  describe('incrementRetryCount', () => {
    it('should increment retry count successfully', async () => {
      const updatedJob = { ...mockJob, retryCount: 1, lastRetryAt: new Date() }

      mockPrismaService.scrapingJob.update.mockResolvedValue(updatedJob)

      const result = await repository.incrementRetryCount(mockJob.id)

      expect(mockPrismaService.scrapingJob.update).toHaveBeenCalledWith({
        where: { id: mockJob.id },
        data: {
          retryCount: { increment: 1 },
          lastRetryAt: expect.any(Date),
        },
      })
      expect(result).toEqual(updatedJob)
    })
  })

  describe('deleteById', () => {
    it('should delete a job successfully', async () => {
      mockPrismaService.scrapingJob.delete.mockResolvedValue(mockJob)

      await repository.deleteById(mockJob.id)

      expect(mockPrismaService.scrapingJob.delete).toHaveBeenCalledWith({
        where: { id: mockJob.id },
      })
    })
  })

  describe('countByStatus', () => {
    it('should count jobs by status', async () => {
      mockPrismaService.scrapingJob.count.mockResolvedValue(5)

      const result = await repository.countByStatus('PENDING')

      expect(mockPrismaService.scrapingJob.count).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
      })
      expect(result).toBe(5)
    })
  })

  describe('findByStatus', () => {
    it('should find jobs by status', async () => {
      const jobs = [mockJob]
      mockPrismaService.scrapingJob.findMany.mockResolvedValue(jobs)

      const result = await repository.findByStatus('PENDING')

      expect(mockPrismaService.scrapingJob.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
      })
      expect(result).toEqual(jobs)
    })
  })
})
