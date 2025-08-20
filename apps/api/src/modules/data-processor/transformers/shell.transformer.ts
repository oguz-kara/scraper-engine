import { Injectable, Logger } from '@nestjs/common'
import { BaseTransformer, TransformationResult, NormalizedProduct } from '../interfaces/transformation.interface'

@Injectable()
export class ShellTransformer implements BaseTransformer {
  provider = 'SHELL'
  version = '1.0.0'
  private readonly logger = new Logger(ShellTransformer.name)

  async transform(rawData: any, metadata?: Record<string, any>): Promise<TransformationResult> {
    try {
      this.logger.debug(`Transforming Shell data for item: ${rawData.productName || 'unknown'}`)

      // Validate input data
      const validationResult = await this.validate(rawData)
      if (!validationResult) {
        return {
          success: false,
          errors: ['Invalid input data structure for Shell transformer'],
        }
      }

      // Transform to normalized format
      const normalizedData: NormalizedProduct = {
        name: this.cleanString(rawData.productName),
        code: rawData.productCode ? this.cleanString(rawData.productCode) : undefined,
        brand: 'Shell',
        category: this.extractCategory(rawData),
        specifications: this.normalizeSpecifications(rawData.specifications),
        applications: this.normalizeApplications(rawData.applications),
        description: rawData.description ? this.cleanString(rawData.description) : undefined,
        documents: {
          technical: rawData.technicalDataSheet,
          safety: rawData.safetyDataSheet,
        },
        media: {
          images: this.normalizeImages(rawData.images),
        },
        pricing: this.normalizePricing(rawData.price),
        availability: this.normalizeAvailability(rawData.availability),
        metadata: {
          source: metadata?.sourceUrl || 'shell.com',
          scrapedAt: new Date(),
          version: this.version,
        },
      }

      // Validate transformed data
      const transformedValidation = await this.validateTransformed(normalizedData)
      if (!transformedValidation.isValid) {
        return {
          success: false,
          errors: transformedValidation.errors,
          warnings: transformedValidation.warnings,
        }
      }

      return {
        success: true,
        data: normalizedData,
        warnings: transformedValidation.warnings,
      }
    } catch (error) {
      this.logger.error('Error transforming Shell data:', error)
      return {
        success: false,
        errors: [`Transformation failed: ${error.message}`],
      }
    }
  }

  async validate(data: Record<string, any>): Promise<boolean> {
    // Check required fields
    if (!data.productName || typeof data.productName !== 'string') {
      this.logger.warn('Missing or invalid productName in Shell data')
      return false
    }

    if (!data.viscosity || typeof data.viscosity !== 'string') {
      this.logger.warn('Missing or invalid viscosity in Shell data')
      return false
    }

    // Check optional arrays
    if (data.specifications && !Array.isArray(data.specifications)) {
      this.logger.warn('Invalid specifications format in Shell data')
      return false
    }

    if (data.applications && !Array.isArray(data.applications)) {
      this.logger.warn('Invalid applications format in Shell data')
      return false
    }

    return true
  }

  getSchema(): Record<string, any> {
    return {
      type: 'object',
      required: ['productName', 'viscosity'],
      properties: {
        productName: { type: 'string', minLength: 1 },
        productCode: { type: 'string' },
        viscosity: { type: 'string', minLength: 1 },
        specifications: {
          type: 'array',
          items: { type: 'string' },
        },
        applications: {
          type: 'array',
          items: { type: 'string' },
        },
        description: { type: 'string' },
        technicalDataSheet: { type: 'string', format: 'uri' },
        safetyDataSheet: { type: 'string', format: 'uri' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'uri' },
        },
        availability: { type: 'string' },
        price: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            currency: { type: 'string' },
            unit: { type: 'string' },
          },
        },
      },
    }
  }

  private cleanString(str: string): string {
    return str
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-./]/g, '')
  }

  private extractCategory(data: any): string {
    // Extract category from product name or specifications
    const productName = data.productName?.toLowerCase() || ''

    if (productName.includes('engine') || productName.includes('motor')) {
      return 'Engine Oil'
    }
    if (productName.includes('hydraulic')) {
      return 'Hydraulic Oil'
    }
    if (productName.includes('gear')) {
      return 'Gear Oil'
    }
    if (productName.includes('transmission')) {
      return 'Transmission Fluid'
    }
    if (productName.includes('grease')) {
      return 'Grease'
    }

    return 'Lubricant'
  }

  private normalizeSpecifications(specs: string[] | undefined): Record<string, any> {
    if (!specs || !Array.isArray(specs)) {
      return {}
    }

    const normalized: Record<string, any> = {}

    specs.forEach(spec => {
      const cleanSpec = this.cleanString(spec)

      // Extract viscosity grade
      const viscosityMatch = cleanSpec.match(/(\d+W?-?\d*)/i)
      if (viscosityMatch) {
        normalized.viscosityGrade = viscosityMatch[1]
      }

      // Extract API specifications
      if (cleanSpec.includes('API')) {
        const apiMatch = cleanSpec.match(/API\s+([A-Z]+)/i)
        if (apiMatch) {
          normalized.apiSpecification = apiMatch[1]
        }
      }

      // Extract ACEA specifications
      if (cleanSpec.includes('ACEA')) {
        const aceaMatch = cleanSpec.match(/ACEA\s+([A-Z0-9-]+)/i)
        if (aceaMatch) {
          normalized.aceaSpecification = aceaMatch[1]
        }
      }

      // Store original specifications
      if (!normalized.originalSpecs) {
        normalized.originalSpecs = []
      }
      normalized.originalSpecs.push(cleanSpec)
    })

    return normalized
  }

  private normalizeApplications(apps: string[] | undefined): string[] {
    if (!apps || !Array.isArray(apps)) {
      return []
    }

    return apps
      .map(app => this.cleanString(app))
      .filter(app => app.length > 0)
      .map(app => {
        // Normalize common application terms
        return app
          .replace(/passenger car/gi, 'Passenger Car')
          .replace(/commercial vehicle/gi, 'Commercial Vehicle')
          .replace(/heavy duty/gi, 'Heavy Duty')
          .replace(/industrial/gi, 'Industrial')
      })
  }

  private normalizeImages(images: string[] | undefined): string[] | undefined {
    if (!images || !Array.isArray(images)) {
      return undefined
    }

    return images
      .filter(img => img && typeof img === 'string')
      .map(img => img.trim())
      .filter(img => this.isValidUrl(img))
  }

  private normalizePricing(price: any): NormalizedProduct['pricing'] {
    if (!price || typeof price !== 'object') {
      return undefined
    }

    if (typeof price.value !== 'number' || price.value <= 0) {
      return undefined
    }

    return {
      value: price.value,
      currency: price.currency || 'USD',
      unit: price.unit || 'liter',
    }
  }

  private normalizeAvailability(availability: string | undefined): NormalizedProduct['availability'] {
    if (!availability || typeof availability !== 'string') {
      return undefined
    }

    const cleanAvailability = this.cleanString(availability).toLowerCase()

    let status = 'unknown'
    if (cleanAvailability.includes('in stock') || cleanAvailability.includes('available')) {
      status = 'in_stock'
    } else if (cleanAvailability.includes('out of stock') || cleanAvailability.includes('unavailable')) {
      status = 'out_of_stock'
    } else if (cleanAvailability.includes('limited')) {
      status = 'limited'
    }

    return { status }
  }

  private async validateTransformed(data: NormalizedProduct): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields validation
    if (!data.name || data.name.length < 2) {
      errors.push('Product name is required and must be at least 2 characters')
    }

    if (!data.brand) {
      errors.push('Brand is required')
    }

    if (!data.category) {
      warnings.push('Category could not be determined')
    }

    // Specifications validation
    if (!data.specifications || Object.keys(data.specifications).length === 0) {
      warnings.push('No specifications could be extracted')
    }

    // Applications validation
    if (!data.applications || data.applications.length === 0) {
      warnings.push('No applications could be extracted')
    }

    // Metadata validation
    if (!data.metadata.source) {
      warnings.push('Source URL is missing')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}
