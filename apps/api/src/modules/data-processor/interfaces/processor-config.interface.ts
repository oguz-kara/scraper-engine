export interface ProcessorConfig {
  batchSize: number
  batchTimeoutMs: number
  maxRetries: number
  retryDelayMs: number
  enableDeduplication: boolean
  enableTransformation: boolean
  storageOptions: {
    storeRawHtml: boolean
    storeNormalizedData: boolean
    compressionEnabled: boolean
  }
}

export interface DeduplicationConfig {
  provider: string
  keyFields: string[]
  strategy: 'composite' | 'hash' | 'custom'
  customKeyGenerator?: (item: any) => string
}

export interface TransformationConfig {
  provider: string
  transformers: string[]
  validationRules: Record<string, any>
  fallbackValues: Record<string, any>
}

// Event interfaces are defined in ../events/processor.events.ts
// This file only contains configuration interfaces