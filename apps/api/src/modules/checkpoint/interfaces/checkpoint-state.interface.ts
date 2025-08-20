export interface CheckpointState {
  // Progress tracking
  progress: {
    currentSearchTermIndex: number
    currentResultIndex: number
    totalSearchTerms: number
    processedSearchTerms: string[]
    remainingSearchTerms: string[]
    itemsScraped: number
  }

  // Browser state
  browser: {
    cookies: any[]
    localStorage: Record<string, string>
    sessionStorage: Record<string, string>
    currentUrl: string
  }

  // Scraping context
  context: {
    lastScrapedItem?: any
    lastSuccessfulSearchTerm?: string
    currentResultData?: any
    errors: Array<{
      searchTerm: string
      error: string
      timestamp: Date
    }>
  }

  // Metadata
  metadata: {
    provider: string
    strategyVersion: string
    checkpointVersion: string
    timestamp: Date
  }
}

export interface CheckpointConfig {
  enabled: boolean
  intervalSeconds: number // Save checkpoint every N seconds
  intervalItems: number // Save checkpoint every N items
  maxCheckpoints: number // Keep only last N checkpoints
  saveOnPause: boolean // Auto-save when job is paused
  saveOnError: boolean // Auto-save when error occurs
}
