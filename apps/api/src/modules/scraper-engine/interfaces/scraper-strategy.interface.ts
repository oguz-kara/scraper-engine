import { Browser } from 'playwright'
import { ScrapingProvider } from '@prisma/client'

export interface ScraperInput {
  searchTerms?: string[] // List of car/machine models to search
  urls?: string[] // Direct URLs if any
  filters?: Record<string, any>
}

export interface ScrapedItem {
  provider: ScrapingProvider
  deduplicationKey: string
  data: Record<string, any>
  rawHtml?: string
  metadata: {
    url: string
    timestamp: Date
    searchTerm?: string
    category?: string
    [key: string]: any
  }
}

export interface ScraperStrategy {
  getProvider(): ScrapingProvider
  initialize(browser: Browser): Promise<void>
  scrape(
    jobId: string,
    input: ScraperInput,
    onProgress: (processed: number, total: number) => void,
  ): AsyncGenerator<ScrapedItem>
  cleanup(): Promise<void>
  saveBrowserState(): Promise<any>
  restoreBrowserState(state: any): Promise<void>
}
