import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../common/database/prisma.service'
import type { Checkpoint } from '@prisma/client'

@Injectable()
export class CheckpointRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    jobId: string
    sequenceNumber: number
    state: any
    itemsProcessed: number
    browserState?: any
  }): Promise<Checkpoint> {
    return this.prisma.checkpoint.create({
      data: {
        jobId: data.jobId,
        sequenceNumber: data.sequenceNumber,
        state: data.state,
        itemsProcessed: data.itemsProcessed,
        browserState: data.browserState,
      },
    })
  }

  async findById(id: string): Promise<Checkpoint | null> {
    return this.prisma.checkpoint.findUnique({
      where: { id },
    })
  }

  async findLatestForJob(jobId: string): Promise<Checkpoint | null> {
    return this.prisma.checkpoint.findFirst({
      where: { jobId },
      orderBy: { sequenceNumber: 'desc' },
    })
  }

  async findAllForJob(jobId: string): Promise<Checkpoint[]> {
    return this.prisma.checkpoint.findMany({
      where: { jobId },
      orderBy: { sequenceNumber: 'asc' },
    })
  }

  async findBySequenceNumber(jobId: string, sequenceNumber: number): Promise<Checkpoint | null> {
    return this.prisma.checkpoint.findUnique({
      where: {
        jobId_sequenceNumber: {
          jobId,
          sequenceNumber,
        },
      },
    })
  }

  async getNextSequenceNumber(jobId: string): Promise<number> {
    const latest = await this.findLatestForJob(jobId)
    return latest ? latest.sequenceNumber + 1 : 1
  }

  async deleteOldCheckpoints(jobId: string, keepCount: number): Promise<number> {
    // Get checkpoints to delete (keep the latest N)
    const checkpointsToDelete = await this.prisma.checkpoint.findMany({
      where: { jobId },
      orderBy: { sequenceNumber: 'desc' },
      skip: keepCount,
      select: { id: true },
    })

    if (checkpointsToDelete.length > 0) {
      const result = await this.prisma.checkpoint.deleteMany({
        where: {
          id: { in: checkpointsToDelete.map(c => c.id) },
        },
      })
      return result.count
    }

    return 0
  }

  async deleteAllForJob(jobId: string): Promise<number> {
    const result = await this.prisma.checkpoint.deleteMany({
      where: { jobId },
    })
    return result.count
  }

  async getCheckpointStats(jobId: string): Promise<{
    total: number
    latest?: {
      sequenceNumber: number
      itemsProcessed: number
      createdAt: Date
    }
  }> {
    const [total, latest] = await Promise.all([
      this.prisma.checkpoint.count({
        where: { jobId },
      }),
      this.prisma.checkpoint.findFirst({
        where: { jobId },
        orderBy: { sequenceNumber: 'desc' },
        select: {
          sequenceNumber: true,
          itemsProcessed: true,
          createdAt: true,
        },
      }),
    ])

    return {
      total,
      latest: latest || undefined,
    }
  }

  async updateCheckpointState(checkpointId: string, state: any): Promise<Checkpoint> {
    return this.prisma.checkpoint.update({
      where: { id: checkpointId },
      data: { state },
    })
  }
}
