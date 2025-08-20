import { Browser } from 'playwright'
import { ScrapingProvider } from '@prisma/client'

export interface ScraperInput {
  searchTerms?: string[] // List of car/machine models to search
  categories?: string[] // Categories like Cars, Vans, Motorcycles (for Shell)
  urls?: string[] // Direct URLs if any
  filters?: Record<string, any>
  yearFilter?: string[] // Optional: specific years to filter
  fuelTypeFilter?: string[] // Optional: Diesel, Petrol, etc.
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
    checkpoint?: any,
  ): AsyncGenerator<ScrapedItem>
  cleanup(): Promise<void>
  saveBrowserState(): Promise<any>
  restoreBrowserState(state: any): Promise<void>
}
