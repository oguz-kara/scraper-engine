export interface TransformationResult {
  success: boolean
  data?: Record<string, any>
  errors?: string[]
  warnings?: string[]
}

export interface BaseTransformer {
  provider: string
  version: string
  transform(rawData: any, metadata?: Record<string, any>): Promise<TransformationResult>
  validate(data: Record<string, any>): Promise<boolean>
  getSchema(): Record<string, any>
}

export interface ShellOilData {
  productName: string
  productCode?: string
  viscosity: string
  specifications: string[]
  applications: string[]
  description?: string
  technicalDataSheet?: string
  safetyDataSheet?: string
  images?: string[]
  availability?: string
  price?: {
    value: number
    currency: string
    unit: string
  }
}

export interface NormalizedProduct {
  name: string
  code?: string
  brand: string
  category: string
  specifications: Record<string, any>
  applications: string[]
  description?: string
  documents: {
    technical?: string
    safety?: string
  }
  media: {
    images?: string[]
    videos?: string[]
  }
  pricing?: {
    value: number
    currency: string
    unit: string
  }
  availability?: {
    status: string
    locations?: string[]
  }
  metadata: {
    source: string
    scrapedAt: Date
    version: string
  }
}