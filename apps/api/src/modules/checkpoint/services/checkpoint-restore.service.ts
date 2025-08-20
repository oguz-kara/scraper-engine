import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { CheckpointService } from './checkpoint.service'
import { CheckpointState } from '../interfaces/checkpoint-state.interface'
import { ScrapingJob } from '@prisma/client'

@Injectable()
export class CheckpointRestoreService {
  private readonly logger = new Logger(CheckpointRestoreService.name)

  constructor(
    private checkpointService: CheckpointService,
    private eventEmitter: EventEmitter2,
  ) {}

  async prepareJobResumption(
    job: ScrapingJob,
    checkpointId?: string,
  ): Promise<{
    shouldResume: boolean
    checkpoint?: CheckpointState
    resumeFromIndex?: number
    message: string
  }> {
    try {
      this.logger.log(`Preparing job ${job.id} for resumption`)

      // Get the checkpoint to restore from
      const checkpoint = await this.checkpointService.restoreFromCheckpoint(job.id, checkpointId)

      if (!checkpoint) {
        return {
          shouldResume: false,
          message: 'No checkpoint found - job will start from beginning',
        }
      }

      // Validate that checkpoint is compatible with current job input
      const isCompatible = await this.validateCheckpointCompatibility(job, checkpoint)

      if (!isCompatible) {
        this.logger.warn(`Checkpoint for job ${job.id} is incompatible with current input`)
        return {
          shouldResume: false,
          message: 'Checkpoint incompatible with current job input - job will start from beginning',
        }
      }

      // Calculate resume position
      const resumeFromIndex = checkpoint.progress.currentSearchTermIndex
      const totalTerms = checkpoint.progress.totalSearchTerms
      const itemsScraped = checkpoint.progress.itemsScraped

      this.logger.log(
        `Job ${job.id} will resume from search term ${resumeFromIndex}/${totalTerms} (${itemsScraped} items already scraped)`,
      )

      return {
        shouldResume: true,
        checkpoint,
        resumeFromIndex,
        message: `Resuming from checkpoint: term ${resumeFromIndex}/${totalTerms}, ${itemsScraped} items scraped`,
      }
    } catch (error) {
      this.logger.error(`Error preparing job ${job.id} for resumption:`, error)
      return {
        shouldResume: false,
        message: `Checkpoint restoration failed: ${error.message} - job will start from beginning`,
      }
    }
  }

  async createRecoveryCheckpoint(jobId: string, error: Error): Promise<void> {
    try {
      this.logger.log(`Creating recovery checkpoint for failed job ${jobId}`)

      // Create a checkpoint specifically for recovery purposes
      const checkpointId = await this.checkpointService.createCheckpoint(jobId, 'error')

      if (checkpointId) {
        this.eventEmitter.emit('checkpoint.recovery', {
          jobId,
          checkpointId,
          error: error.message,
          timestamp: new Date(),
        })

        this.logger.log(`Recovery checkpoint ${checkpointId} created for job ${jobId}`)
      }
    } catch (checkpointError) {
      this.logger.error(`Failed to create recovery checkpoint for job ${jobId}:`, checkpointError)
    }
  }

  async getResumableJobs(): Promise<
    Array<{
      jobId: string
      lastCheckpoint: any
      itemsScraped: number
      progress: number
    }>
  > {
    try {
      // This would typically query jobs that are in PAUSED or FAILED state
      // and have checkpoints available

      // For now, return empty array - this would be implemented based on job status
      return []
    } catch (error) {
      this.logger.error('Error getting resumable jobs:', error)
      return []
    }
  }

  private async validateCheckpointCompatibility(job: ScrapingJob, checkpoint: CheckpointState): Promise<boolean> {
    try {
      // Check if the job input is compatible with the checkpoint
      const currentInput = job.input as any

      // Basic validation
      if (!currentInput || !checkpoint.progress) {
        return false
      }

      // Check if search terms match
      const currentSearchTerms = currentInput.searchTerms || []
      const checkpointSearchTerms = [
        ...checkpoint.progress.processedSearchTerms,
        ...checkpoint.progress.remainingSearchTerms,
      ]

      // If search terms don't match, checkpoint is incompatible
      if (!this.arraysEqual(currentSearchTerms, checkpointSearchTerms)) {
        this.logger.warn('Search terms mismatch between job input and checkpoint')
        return false
      }

      // Check provider compatibility
      if (checkpoint.metadata.provider !== job.provider) {
        this.logger.warn('Provider mismatch between job and checkpoint')
        return false
      }

      // Check if current position is still valid
      const currentIndex = checkpoint.progress.currentSearchTermIndex
      if (currentIndex >= currentSearchTerms.length) {
        this.logger.warn('Checkpoint position is beyond current search terms array')
        return false
      }

      return true
    } catch (error) {
      this.logger.error('Error validating checkpoint compatibility:', error)
      return false
    }
  }

  private arraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) {
      return false
    }

    return arr1.every((val, index) => val === arr2[index])
  }

  async debugCheckpointState(jobId: string, checkpointId?: string): Promise<any> {
    try {
      const checkpoint = await this.checkpointService.restoreFromCheckpoint(jobId, checkpointId)

      if (!checkpoint) {
        return { error: 'No checkpoint found' }
      }

      return {
        checkpointFound: true,
        progress: checkpoint.progress,
        browserState: {
          url: checkpoint.browser.currentUrl,
          cookieCount: checkpoint.browser.cookies.length,
          localStorageKeys: Object.keys(checkpoint.browser.localStorage),
        },
        context: checkpoint.context,
        metadata: checkpoint.metadata,
        errors: checkpoint.context.errors,
      }
    } catch (error) {
      return { error: error.message }
    }
  }

  async cleanupJobCheckpoints(jobId: string): Promise<{ deleted: number }> {
    try {
      const deletedCount = await this.checkpointService.deleteCheckpointsForJob(jobId)
      this.logger.log(`Cleaned up ${deletedCount} checkpoints for job ${jobId}`)

      return { deleted: deletedCount }
    } catch (error) {
      this.logger.error(`Error cleaning up checkpoints for job ${jobId}:`, error)
      throw error
    }
  }

  async migrateCheckpoint(jobId: string, checkpointId: string, targetVersion: string): Promise<boolean> {
    try {
      // This would implement checkpoint version migration logic
      // For example, migrating from checkpoint v1.0 to v1.1 format

      this.logger.log(`Migrating checkpoint ${checkpointId} for job ${jobId} to version ${targetVersion}`)

      // Implementation would depend on specific migration needs
      // For now, return true as a placeholder
      return true
    } catch (error) {
      this.logger.error(`Error migrating checkpoint ${checkpointId}:`, error)
      return false
    }
  }
}
