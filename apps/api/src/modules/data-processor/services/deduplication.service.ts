import { Injectable, Logger } from '@nestjs/common'
import { ScrapedItemInput } from '../interfaces/scraped-item.interface'
import { ScrapedItemRepository } from '../repositories/scraped-item.repository'
import { createHash } from 'crypto'

export abstract class BaseDeduplicationStrategy {
  abstract provider: string
  abstract generateKey(item: ScrapedItemInput): string
}

@Injectable()
export class ShellDeduplicationStrategy extends BaseDeduplicationStrategy {
  provider = 'SHELL'

  generateKey(item: ScrapedItemInput): string {
    const data = item.normalizedData

    // Use product name and specifications as key components
    const keyParts: string[] = []

    if (data.productName) {
      keyParts.push(data.productName.toLowerCase().trim())
    }

    if (data.productCode) {
      keyParts.push(data.productCode.toLowerCase().trim())
    }

    if (data.viscosity) {
      keyParts.push(data.viscosity.toLowerCase().trim())
    }

    // Add specifications for more unique identification
    if (data.specifications && Array.isArray(data.specifications)) {
      const specsHash = this.hashArray(data.specifications)
      keyParts.push(specsHash)
    }

    const combinedKey = keyParts.join('::')
    return `${this.provider}::${this.hashString(combinedKey)}`
  }

  private hashArray(arr: string[]): string {
    const sorted = arr.map(s => s.toLowerCase().trim()).sort()
    return this.hashString(sorted.join('|'))
  }

  private hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex').substring(0, 16)
  }
}

@Injectable()
export class CastrolDeduplicationStrategy extends BaseDeduplicationStrategy {
  provider = 'CASTROL'

  generateKey(item: ScrapedItemInput): string {
    const data = item.normalizedData

    const keyParts: string[] = []

    if (data.productName) {
      keyParts.push(data.productName.toLowerCase().trim())
    }

    if (data.grade) {
      keyParts.push(data.grade.toLowerCase().trim())
    }

    if (data.category) {
      keyParts.push(data.category.toLowerCase().trim())
    }

    const combinedKey = keyParts.join('::')
    return `${this.provider}::${this.hashString(combinedKey)}`
  }

  private hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex').substring(0, 16)
  }
}

@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name)
  private strategies = new Map<string, BaseDeduplicationStrategy>()

  constructor(
    private scrapedItemRepository: ScrapedItemRepository,
    private shellStrategy: ShellDeduplicationStrategy,
    private castrolStrategy: CastrolDeduplicationStrategy,
  ) {
    this.registerStrategy(shellStrategy)
    this.registerStrategy(castrolStrategy)
  }

  private registerStrategy(strategy: BaseDeduplicationStrategy): void {
    this.strategies.set(strategy.provider, strategy)
    this.logger.log(`Registered deduplication strategy for provider: ${strategy.provider}`)
  }

  async checkDuplicate(item: ScrapedItemInput): Promise<{
    isDuplicate: boolean
    deduplicationKey: string
    existingItem?: any
  }> {
    try {
      const deduplicationKey = this.generateDeduplicationKey(item)
      const existingItem = await this.scrapedItemRepository.findByDeduplicationKey(deduplicationKey)

      return {
        isDuplicate: !!existingItem,
        deduplicationKey,
        existingItem,
      }
    } catch (error) {
      this.logger.error(`Error checking duplicate for item:`, error)
      // In case of error, assume not duplicate to avoid losing data
      return {
        isDuplicate: false,
        deduplicationKey: this.generateFallbackKey(item),
      }
    }
  }

  async batchCheckDuplicates(items: ScrapedItemInput[]): Promise<{
    uniqueItems: ScrapedItemInput[]
    duplicates: Array<{
      item: ScrapedItemInput
      deduplicationKey: string
      existingItem?: any
    }>
  }> {
    const uniqueItems: ScrapedItemInput[] = []
    const duplicates: Array<{
      item: ScrapedItemInput
      deduplicationKey: string
      existingItem?: any
    }> = []

    try {
      // Process items in parallel for better performance
      const promises = items.map(item => this.checkDuplicate(item))
      const results = await Promise.all(promises)

      results.forEach((result, index) => {
        if (result.isDuplicate) {
          duplicates.push({
            item: items[index],
            deduplicationKey: result.deduplicationKey,
            existingItem: result.existingItem,
          })
        } else {
          uniqueItems.push(items[index])
        }
      })

      this.logger.log(`Batch deduplication completed: ${uniqueItems.length} unique, ${duplicates.length} duplicates`)

      return { uniqueItems, duplicates }
    } catch (error) {
      this.logger.error('Error in batch deduplication:', error)
      // In case of error, return all items as unique to avoid data loss
      return { uniqueItems: items, duplicates: [] }
    }
  }

  generateDeduplicationKey(item: ScrapedItemInput): string {
    const provider = this.extractProvider(item)
    const strategy = this.strategies.get(provider)

    if (!strategy) {
      this.logger.warn(`No deduplication strategy found for provider: ${provider}`)
      return this.generateFallbackKey(item)
    }

    try {
      return strategy.generateKey(item)
    } catch (error) {
      this.logger.error(`Error generating deduplication key with strategy ${provider}:`, error)
      return this.generateFallbackKey(item)
    }
  }

  private extractProvider(item: ScrapedItemInput): string {
    // Extract provider from job or metadata
    if (item.metadata?.provider) {
      return item.metadata.provider.toString().toUpperCase()
    }

    // Fallback: try to detect from URL or other indicators
    if (item.sourceUrl?.includes('shell')) {
      return 'SHELL'
    }
    if (item.sourceUrl?.includes('castrol')) {
      return 'CASTROL'
    }

    return 'UNKNOWN'
  }

  private generateFallbackKey(item: ScrapedItemInput): string {
    // Generate a fallback key using job ID and normalized data hash
    const dataStr = JSON.stringify(item.normalizedData, Object.keys(item.normalizedData).sort())
    const hash = createHash('sha256').update(dataStr).digest('hex').substring(0, 16)
    return `FALLBACK::${item.jobId}::${hash}`
  }

  getRegisteredProviders(): string[] {
    return Array.from(this.strategies.keys())
  }

  getStrategyForProvider(provider: string): BaseDeduplicationStrategy | undefined {
    return this.strategies.get(provider)
  }

  async getDeduplicationStats(jobId: string): Promise<{
    totalItems: number
    uniqueItems: number
    duplicateCount: number
    deduplicationRate: number
  }> {
    try {
      // This would require additional tracking in the database
      // For now, return basic stats
      const totalItems = await this.scrapedItemRepository.countByJobId(jobId)

      return {
        totalItems,
        uniqueItems: totalItems, // Assuming all stored items are unique
        duplicateCount: 0, // Would need separate tracking
        deduplicationRate: 0,
      }
    } catch (error) {
      this.logger.error(`Error getting deduplication stats for job ${jobId}:`, error)
      return {
        totalItems: 0,
        uniqueItems: 0,
        duplicateCount: 0,
        deduplicationRate: 0,
      }
    }
  }
}
