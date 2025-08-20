import { Injectable, Logger } from '@nestjs/common'
import { BaseTransformer, TransformationResult } from '../interfaces/transformation.interface'
import { ShellTransformer } from '../transformers/shell.transformer'
import { ScrapedItemInput } from '../interfaces/scraped-item.interface'

@Injectable()
export class TransformationService {
  private readonly logger = new Logger(TransformationService.name)
  private transformers = new Map<string, BaseTransformer>()

  constructor(private shellTransformer: ShellTransformer) {
    this.registerTransformer(shellTransformer)
  }

  private registerTransformer(transformer: BaseTransformer): void {
    this.transformers.set(transformer.provider, transformer)
    this.logger.log(`Registered transformer for provider: ${transformer.provider}`)
  }

  async transformItem(item: ScrapedItemInput): Promise<{
    success: boolean
    transformedData?: Record<string, any>
    originalData: Record<string, any>
    errors?: string[]
    warnings?: string[]
  }> {
    try {
      const provider = this.extractProvider(item)
      const transformer = this.transformers.get(provider)

      if (!transformer) {
        this.logger.warn(`No transformer found for provider: ${provider}`)
        return {
          success: false,
          originalData: item.normalizedData,
          errors: [`No transformer available for provider: ${provider}`],
        }
      }

      this.logger.debug(`Transforming item using ${provider} transformer`)

      const result = await transformer.transform(item.normalizedData, item.metadata)

      if (!result.success) {
        this.logger.warn(`Transformation failed for provider ${provider}:`, result.errors)
        return {
          success: false,
          originalData: item.normalizedData,
          errors: result.errors,
          warnings: result.warnings,
        }
      }

      return {
        success: true,
        transformedData: result.data,
        originalData: item.normalizedData,
        warnings: result.warnings,
      }
    } catch (error) {
      this.logger.error('Error transforming item:', error)
      return {
        success: false,
        originalData: item.normalizedData,
        errors: [`Transformation error: ${error.message}`],
      }
    }
  }

  async batchTransform(items: ScrapedItemInput[]): Promise<{
    successfulTransformations: Array<{
      item: ScrapedItemInput
      transformedData: Record<string, any>
      warnings?: string[]
    }>
    failedTransformations: Array<{
      item: ScrapedItemInput
      errors: string[]
      warnings?: string[]
    }>
    stats: {
      total: number
      successful: number
      failed: number
      byProvider: Record<string, { successful: number; failed: number }>
    }
  }> {
    const successfulTransformations: Array<{
      item: ScrapedItemInput
      transformedData: Record<string, any>
      warnings?: string[]
    }> = []

    const failedTransformations: Array<{
      item: ScrapedItemInput
      errors: string[]
      warnings?: string[]
    }> = []

    const providerStats: Record<string, { successful: number; failed: number }> = {}

    try {
      // Process transformations in parallel for better performance
      const promises = items.map(item => this.transformItem(item))
      const results = await Promise.all(promises)

      results.forEach((result, index) => {
        const item = items[index]
        const provider = this.extractProvider(item)

        // Initialize provider stats if not exists
        if (!providerStats[provider]) {
          providerStats[provider] = { successful: 0, failed: 0 }
        }

        if (result.success && result.transformedData) {
          successfulTransformations.push({
            item,
            transformedData: result.transformedData,
            warnings: result.warnings,
          })
          providerStats[provider].successful++
        } else {
          failedTransformations.push({
            item,
            errors: result.errors || ['Unknown transformation error'],
            warnings: result.warnings,
          })
          providerStats[provider].failed++
        }
      })

      const stats = {
        total: items.length,
        successful: successfulTransformations.length,
        failed: failedTransformations.length,
        byProvider: providerStats,
      }

      this.logger.log(
        `Batch transformation completed: ${stats.successful}/${stats.total} successful`,
        JSON.stringify(stats.byProvider),
      )

      return {
        successfulTransformations,
        failedTransformations,
        stats,
      }
    } catch (error) {
      this.logger.error('Error in batch transformation:', error)

      // Return all items as failed
      const allFailed = items.map(item => ({
        item,
        errors: [`Batch transformation error: ${error.message}`],
      }))

      return {
        successfulTransformations: [],
        failedTransformations: allFailed,
        stats: {
          total: items.length,
          successful: 0,
          failed: items.length,
          byProvider: {},
        },
      }
    }
  }

  async validateTransformedData(
    data: Record<string, any>,
    provider: string,
  ): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    try {
      const transformer = this.transformers.get(provider)

      if (!transformer) {
        return {
          isValid: false,
          errors: [`No transformer found for provider: ${provider}`],
          warnings: [],
        }
      }

      const isValid = await transformer.validate(data)

      return {
        isValid,
        errors: isValid ? [] : ['Data validation failed'],
        warnings: [],
      }
    } catch (error) {
      this.logger.error(`Error validating data for provider ${provider}:`, error)
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
      }
    }
  }

  getAvailableTransformers(): Array<{
    provider: string
    version: string
    schema: Record<string, any>
  }> {
    return Array.from(this.transformers.entries()).map(([provider, transformer]) => ({
      provider,
      version: transformer.version,
      schema: transformer.getSchema(),
    }))
  }

  getTransformerForProvider(provider: string): BaseTransformer | undefined {
    return this.transformers.get(provider)
  }

  async getTransformationStats(provider?: string): Promise<{
    totalTransformations: number
    successfulTransformations: number
    failedTransformations: number
    successRate: number
    commonErrors: Array<{
      error: string
      count: number
    }>
  }> {
    // This would typically query logs or a metrics store
    // For now, return mock data
    return {
      totalTransformations: 0,
      successfulTransformations: 0,
      failedTransformations: 0,
      successRate: 0,
      commonErrors: [],
    }
  }

  private extractProvider(item: ScrapedItemInput): string {
    // Extract provider from job metadata or other indicators
    if (item.metadata?.provider) {
      return item.metadata.provider.toString().toUpperCase()
    }

    // Fallback: try to detect from URL
    if (item.sourceUrl?.includes('shell')) {
      return 'SHELL'
    }
    if (item.sourceUrl?.includes('castrol')) {
      return 'CASTROL'
    }

    return 'UNKNOWN'
  }

  async refreshTransformerCache(): Promise<void> {
    this.logger.log('Refreshing transformer cache...')

    // Re-register all transformers to refresh any cached configurations
    const transformersToRefresh = Array.from(this.transformers.values())
    this.transformers.clear()

    transformersToRefresh.forEach(transformer => {
      this.registerTransformer(transformer)
    })

    this.logger.log(`Refreshed ${transformersToRefresh.length} transformers`)
  }

  async testTransformer(
    provider: string,
    testData: Record<string, any>,
  ): Promise<{
    transformerFound: boolean
    validationResult?: boolean
    transformationResult?: TransformationResult
    processingTime: number
  }> {
    const startTime = Date.now()

    try {
      const transformer = this.transformers.get(provider)

      if (!transformer) {
        return {
          transformerFound: false,
          processingTime: Date.now() - startTime,
        }
      }

      const validationResult = await transformer.validate(testData)
      const transformationResult = await transformer.transform(testData)

      return {
        transformerFound: true,
        validationResult,
        transformationResult,
        processingTime: Date.now() - startTime,
      }
    } catch (error) {
      this.logger.error(`Error testing transformer for ${provider}:`, error)
      return {
        transformerFound: false,
        processingTime: Date.now() - startTime,
      }
    }
  }
}
