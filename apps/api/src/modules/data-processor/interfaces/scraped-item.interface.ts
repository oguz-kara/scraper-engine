export interface ScrapedItem {
  id?: string
  jobId: string
  provider: string
  deduplicationKey: string
  rawHtml: string
  normalizedData: Record<string, any>
  sourceUrl?: string
  scrapedAt: Date
  metadata?: Record<string, any>
}

export interface ScrapedItemInput {
  jobId: string
  provider: string
  rawHtml: string
  normalizedData: Record<string, any>
  sourceUrl?: string
  metadata?: Record<string, any>
}

export interface ProcessorStats {
  totalItems: number
  duplicatesSkipped: number
  itemsStored: number
  transformationErrors: number
  lastProcessedAt: Date
}

export interface BatchResult {
  processedCount: number
  duplicateCount: number
  errorCount: number
  errors: Array<{
    item: ScrapedItemInput
    error: string
  }>
}