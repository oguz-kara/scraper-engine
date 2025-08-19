import { ScrapingProvider } from '@prisma/client'

export interface ScrapedItemData {
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
