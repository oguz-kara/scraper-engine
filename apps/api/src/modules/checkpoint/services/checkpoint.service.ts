import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { ConfigService } from '@nestjs/config'
import { CheckpointRepository } from '../repositories/checkpoint.repository'
import { CheckpointState, CheckpointConfig } from '../interfaces/checkpoint-state.interface'
import type {
  CheckpointEvent,
  CheckpointStateRequest,
  CheckpointStateResponse,
} from '../interfaces/checkpoint-config.interface'
import { ScrapingJob, JobStatus } from '@prisma/client'

@Injectable()
export class CheckpointService {
  private readonly logger = new Logger(CheckpointService.name)
  private activeCheckpoints: Map<string, NodeJS.Timeout> = new Map()
  private itemCounters: Map<string, number> = new Map()
  private pendingStateRequests: Map<
    string,
    {
      resolve: (state: CheckpointState | null) => void
      timeout: NodeJS.Timeout
    }
  > = new Map()

  constructor(
    private checkpointRepository: CheckpointRepository,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async initializeCheckpointing(job: ScrapingJob): Promise<void> {
    const config = this.getCheckpointConfig()

    if (!config.enabled) {
      this.logger.log(`Checkpointing disabled for job ${job.id}`)
      return
    }

    this.logger.log(`Initializing checkpointing for job ${job.id} with config:`, config)

    // Set up interval-based checkpointing
    if (config.intervalSeconds > 0) {
      const interval = setInterval(() => {
        this.createCheckpoint(job.id, 'interval').catch(error => {
          this.logger.warn(`Interval checkpoint failed for job ${job.id}:`, error.message)
        })
      }, config.intervalSeconds * 1000)
      this.activeCheckpoints.set(job.id, interval)
      this.logger.log(`Set up interval checkpointing every ${config.intervalSeconds}s for job ${job.id}`)
    }

    // Initialize item counter
    this.itemCounters.set(job.id, 0)

    this.logger.log(`Checkpoint system initialized for job ${job.id}`)
  }

  async createCheckpoint(
    jobId: string,
    trigger: 'interval' | 'items' | 'pause' | 'error' | 'manual',
  ): Promise<string | null> {
    try {
      this.logger.log(`Creating checkpoint for job ${jobId} (trigger: ${trigger})`)

      // Get current state from scraper
      const state = await this.getCurrentState(jobId)

      if (!state) {
        this.logger.warn(`No state available for job ${jobId}, skipping checkpoint`)
        return null
      }

      // Get next sequence number
      const sequenceNumber = await this.checkpointRepository.getNextSequenceNumber(jobId)

      // Save checkpoint
      const checkpoint = await this.checkpointRepository.create({
        jobId,
        sequenceNumber,
        state,
        itemsProcessed: state.progress.itemsScraped,
        browserState: state.browser,
      })

      // Clean up old checkpoints
      const deletedCount = await this.cleanupOldCheckpoints(jobId)
      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} old checkpoints for job ${jobId}`)
      }

      // Emit event
      this.eventEmitter.emit('checkpoint.created', {
        jobId,
        checkpointId: checkpoint.id,
        sequenceNumber,
        trigger,
        timestamp: new Date(),
      } as CheckpointEvent)

      this.logger.log(`Checkpoint ${sequenceNumber} created for job ${jobId} (${state.progress.itemsScraped} items)`)

      return checkpoint.id
    } catch (error) {
      this.logger.error(`Failed to create checkpoint for job ${jobId}:`, error)
      // Don't throw - checkpointing failure shouldn't stop the job
      return null
    }
  }

  async restoreFromCheckpoint(jobId: string, checkpointId?: string): Promise<CheckpointState | null> {
    try {
      // Get latest checkpoint if not specified
      const checkpoint = checkpointId
        ? await this.checkpointRepository.findById(checkpointId)
        : await this.checkpointRepository.findLatestForJob(jobId)

      if (!checkpoint) {
        this.logger.log(`No checkpoint found for job ${jobId}`)
        return null
      }

      this.logger.log(
        `Restoring job ${jobId} from checkpoint ${checkpoint.sequenceNumber} (${checkpoint.itemsProcessed} items)`,
      )

      const state = checkpoint.state as unknown as CheckpointState

      // Validate checkpoint state
      if (!this.validateCheckpointState(state)) {
        this.logger.error(`Invalid checkpoint state for job ${jobId}, checkpoint ${checkpoint.id}`)
        return null
      }

      // Update item counter to match checkpoint
      this.itemCounters.set(jobId, checkpoint.itemsProcessed)

      // Emit restoration event
      this.eventEmitter.emit('checkpoint.restored', {
        jobId,
        checkpointId: checkpoint.id,
        sequenceNumber: checkpoint.sequenceNumber,
        trigger: 'manual',
        timestamp: new Date(),
      } as CheckpointEvent)

      return state
    } catch (error) {
      this.logger.error(`Failed to restore checkpoint for job ${jobId}:`, error)
      throw error
    }
  }

  async getCheckpointHistory(jobId: string): Promise<any[]> {
    const checkpoints = await this.checkpointRepository.findAllForJob(jobId)

    return checkpoints.map(checkpoint => ({
      id: checkpoint.id,
      sequenceNumber: checkpoint.sequenceNumber,
      itemsProcessed: checkpoint.itemsProcessed,
      createdAt: checkpoint.createdAt,
      progress: (checkpoint.state as any)?.progress || {},
    }))
  }

  async deleteCheckpointsForJob(jobId: string): Promise<number> {
    this.stopCheckpointing(jobId)
    return this.checkpointRepository.deleteAllForJob(jobId)
  }

  private async getCurrentState(jobId: string): Promise<CheckpointState | null> {
    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        this.pendingStateRequests.delete(jobId)
        this.logger.warn(`Checkpoint state request timeout for job ${jobId}`)
        resolve(null)
      }, 10000) // 10 second timeout

      // Store the pending request
      this.pendingStateRequests.set(jobId, { resolve, timeout })

      // Request state from scraper
      this.eventEmitter.emit('checkpoint.requestState', {
        jobId,
        timeout: 10000,
      } as CheckpointStateRequest)
    })
  }

  private async cleanupOldCheckpoints(jobId: string): Promise<number> {
    const config = this.getCheckpointConfig()
    return this.checkpointRepository.deleteOldCheckpoints(jobId, config.maxCheckpoints)
  }

  private validateCheckpointState(state: any): boolean {
    try {
      return (
        state &&
        typeof state === 'object' &&
        state.progress &&
        typeof state.progress.currentSearchTermIndex === 'number' &&
        typeof state.progress.itemsScraped === 'number' &&
        Array.isArray(state.progress.processedSearchTerms) &&
        state.browser &&
        state.metadata &&
        state.metadata.provider
      )
    } catch (error) {
      return false
    }
  }

  private getCheckpointConfig(): CheckpointConfig {
    return {
      enabled: this.configService.get('CHECKPOINT_ENABLED', 'true') === 'true',
      intervalSeconds: parseInt(this.configService.get('CHECKPOINT_INTERVAL_SECONDS', '60')),
      intervalItems: parseInt(this.configService.get('CHECKPOINT_INTERVAL_ITEMS', '100')),
      maxCheckpoints: parseInt(this.configService.get('MAX_CHECKPOINTS', '5')),
      saveOnPause: this.configService.get('CHECKPOINT_SAVE_ON_PAUSE', 'true') === 'true',
      saveOnError: this.configService.get('CHECKPOINT_SAVE_ON_ERROR', 'true') === 'true',
    }
  }

  // Event handlers for checkpoint state responses
  @OnEvent('checkpoint.stateProvided')
  async handleStateProvided(data: CheckpointStateResponse): Promise<void> {
    const request = this.pendingStateRequests.get(data.jobId)
    if (request) {
      clearTimeout(request.timeout)
      this.pendingStateRequests.delete(data.jobId)
      request.resolve(data.state)
    }
  }

  // Event handlers for automatic checkpointing
  @OnEvent('scraper.itemFound')
  async handleItemFound(data: { jobId: string; item: any }): Promise<void> {
    const config = this.getCheckpointConfig()

    if (!config.enabled || config.intervalItems <= 0) {
      return
    }

    const count = this.itemCounters.get(data.jobId) || 0
    const newCount = count + 1
    this.itemCounters.set(data.jobId, newCount)

    // Create checkpoint if we've reached the item interval
    if (newCount % config.intervalItems === 0) {
      await this.createCheckpoint(data.jobId, 'items')
    }
  }

  @OnEvent('job.paused')
  async handleJobPaused(data: { jobId: string }): Promise<void> {
    const config = this.getCheckpointConfig()

    if (config.enabled && config.saveOnPause) {
      await this.createCheckpoint(data.jobId, 'pause')
    }

    // Stop interval checkpointing
    this.stopCheckpointing(data.jobId)
  }

  @OnEvent('scraper.error')
  async handleScraperError(data: { jobId: string; error: string }): Promise<void> {
    const config = this.getCheckpointConfig()

    if (config.enabled && config.saveOnError) {
      await this.createCheckpoint(data.jobId, 'error')
    }
  }

  @OnEvent('job.completed')
  @OnEvent('job.failed')
  @OnEvent('job.cancelled')
  async handleJobEnd(data: { jobId: string }): Promise<void> {
    this.stopCheckpointing(data.jobId)
    this.itemCounters.delete(data.jobId)

    // Clean up any pending state requests
    const request = this.pendingStateRequests.get(data.jobId)
    if (request) {
      clearTimeout(request.timeout)
      this.pendingStateRequests.delete(data.jobId)
    }
  }

  private stopCheckpointing(jobId: string): void {
    const interval = this.activeCheckpoints.get(jobId)
    if (interval) {
      clearInterval(interval)
      this.activeCheckpoints.delete(jobId)
      this.logger.log(`Stopped checkpointing for job ${jobId}`)
    }
  }

  // Health check and monitoring
  getCheckpointingStatus(): any {
    const config = this.getCheckpointConfig()

    return {
      enabled: config.enabled,
      activeJobs: this.activeCheckpoints.size,
      trackedJobs: this.itemCounters.size,
      pendingRequests: this.pendingStateRequests.size,
      config,
      timestamp: new Date(),
    }
  }

  // Manual checkpoint operations
  async createManualCheckpoint(jobId: string): Promise<string | null> {
    return this.createCheckpoint(jobId, 'manual')
  }

  async getJobCheckpointStats(jobId: string): Promise<any> {
    return this.checkpointRepository.getCheckpointStats(jobId)
  }
}
