import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { DataProcessorService } from '../services/data-processor.service'
import { ScrapedItemInput } from '../interfaces/scraped-item.interface'

export interface BatchProcessorJob {
  items: ScrapedItemInput[]
  jobId: string
  provider: string
  batchId: string
  priority: number
}

@Processor('data-processor-batch')
export class BatchProcessor extends WorkerHost {
  private readonly logger = new Logger(BatchProcessor.name)

  constructor(private dataProcessorService: DataProcessorService) {
    super()
  }

  async process(job: Job<BatchProcessorJob>): Promise<void> {
    const { items, jobId, provider, batchId } = job.data

    try {
      this.logger.log(`Processing batch ${batchId} for job ${jobId} (${provider}) with ${items.length} items`)

      // Update job progress
      await job.updateProgress(0)

      let processedCount = 0
      const results = {
        successful: 0,
        duplicates: 0,
        errors: 0,
        errorDetails: [] as string[],
      }

      // Process items in smaller chunks to avoid memory issues
      const chunkSize = 10
      const chunks = this.chunkArray(items, chunkSize)

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]

        try {
          // Process chunk items in parallel
          const chunkPromises = chunk.map(item => this.dataProcessorService.processItemDirectly(item))

          const chunkResults = await Promise.all(chunkPromises)

          // Aggregate results
          chunkResults.forEach(result => {
            if (result.success) {
              if (result.stored) {
                results.successful++
              } else if (result.duplicate) {
                results.duplicates++
              }
            } else {
              results.errors++
              results.errorDetails.push(...result.errors)
            }
          })

          processedCount += chunk.length

          // Update progress
          const progress = Math.round((processedCount / items.length) * 100)
          await job.updateProgress(progress)

          this.logger.debug(`Processed chunk ${i + 1}/${chunks.length} for batch ${batchId}`)
        } catch (chunkError) {
          this.logger.error(`Error processing chunk ${i + 1} of batch ${batchId}:`, chunkError)
          results.errors += chunk.length
          results.errorDetails.push(`Chunk ${i + 1} failed: ${chunkError.message}`)
        }

        // Small delay between chunks to avoid overwhelming the system
        if (i < chunks.length - 1) {
          await this.delay(100)
        }
      }

      // Log final results
      this.logger.log(
        `Batch ${batchId} completed: ${results.successful} stored, ${results.duplicates} duplicates, ${results.errors} errors`,
      )

      if (results.errors > 0) {
        this.logger.warn(`Batch ${batchId} errors:`, results.errorDetails.slice(0, 5))
      }

      // Return results for job completion
      job.returnvalue = {
        batchId,
        itemsProcessed: items.length,
        itemsStored: results.successful,
        duplicatesSkipped: results.duplicates,
        errors: results.errors,
        processingTime: Date.now() - (job.processedOn || 0),
      }
    } catch (error) {
      this.logger.error(`Fatal error processing batch ${batchId}:`, error)
      throw error // This will mark the job as failed
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
