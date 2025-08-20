export interface ScraperItemFoundEvent {
  jobId: string
  provider: string
  item: any
  sourceUrl?: string
  metadata?: Record<string, any>
  timestamp: Date
}

export interface DataProcessorBatchEvent {
  jobId: string
  provider: string
  batchSize: number
  duplicatesSkipped: number
  itemsStored: number
  errors: number
  timestamp: Date
}

export interface DataProcessorErrorEvent {
  jobId: string
  provider: string
  item?: any
  error: string
  stage: 'deduplication' | 'transformation' | 'storage'
  timestamp: Date
}

export interface DataProcessorStatsEvent {
  jobId: string
  provider: string
  totalProcessed: number
  totalDuplicates: number
  totalStored: number
  totalErrors: number
  timestamp: Date
}

export const SCRAPER_EVENTS = {
  ITEM_FOUND: 'scraper.itemFound',
} as const

export const DATA_PROCESSOR_EVENTS = {
  BATCH_PROCESSED: 'dataProcessor.batchProcessed',
  ITEM_STORED: 'dataProcessor.itemStored',
  DUPLICATE_SKIPPED: 'dataProcessor.duplicateSkipped',
  TRANSFORMATION_ERROR: 'dataProcessor.transformationError',
  PROCESSING_ERROR: 'dataProcessor.processingError',
  STATS_UPDATED: 'dataProcessor.statsUpdated',
} as const