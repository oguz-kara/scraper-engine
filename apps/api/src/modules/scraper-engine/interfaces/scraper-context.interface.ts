export interface ScraperContext {
  jobId: string
  currentSearchTerm?: string
  processedItems: number
  totalItems: number
  lastCheckpointAt: Date
  browserState?: any
  metadata: Record<string, any>
}
