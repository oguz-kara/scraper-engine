import { Injectable } from '@nestjs/common'
import { Browser, FrameLocator } from 'playwright'
import { ScrapingProvider } from '@prisma/client'
import { OnEvent } from '@nestjs/event-emitter'
import { BaseScraperStrategy } from './base.strategy'
import { ScraperInput, ScrapedItem } from '../interfaces/scraper-strategy.interface'
import { SHELL_SELECTORS, SHELL_IFRAME_SELECTORS } from '../constants/shell-selectors.constants'
import { CheckpointState } from '../../checkpoint/interfaces/checkpoint-state.interface'

@Injectable()
export class ShellScraperStrategy extends BaseScraperStrategy {
  private readonly shellUrl = 'https://www.shell.com/motorist/find-the-right-oil.html'
  private frame: FrameLocator | null = null
  private currentState: CheckpointState | null = null
  private jobId: string | null = null

  getProvider(): ScrapingProvider {
    return ScrapingProvider.SHELL
  }

  async initialize(browser: Browser): Promise<void> {
    // Create context with realistic browser settings
    this.context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
      javaScriptEnabled: true,
    })

    this.page = await this.context.newPage()

    // Set up console logging for debugging
    this.page.on('console', msg => {
      console.log(`[Shell Browser Console] ${msg.type()}: ${msg.text()}`)
    })

    // Navigate to Shell website
    console.log('Navigating to Shell website...')
    await this.page.goto(this.shellUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    // Wait for and setup iframe
    await this.setupIframe()
  }

  private async setupIframe(): Promise<void> {
    try {
      // Wait for iframe to be present
      await this.page.waitForSelector(SHELL_IFRAME_SELECTORS.iframe, {
        state: 'attached',
        timeout: 15000,
      })

      // Get iframe reference
      this.frame = this.page.frameLocator(SHELL_IFRAME_SELECTORS.iframe).first()

      // Wait for iframe content to load
      await this.frame.locator(SHELL_IFRAME_SELECTORS.iframeBody).waitFor({
        state: 'visible',
        timeout: 15000,
      })

      console.log('Shell iframe loaded successfully')

      // Wait for the search form or main interface to be ready
      await this.waitForSearchInterface()
    } catch (error) {
      console.error('Failed to setup Shell iframe:', error)
      throw new Error(`Shell iframe setup failed: ${error.message}`)
    }
  }

  private async waitForSearchInterface(): Promise<void> {
    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    // Try multiple selectors to find the search interface
    const selectors = [
      SHELL_SELECTORS.searchInput,
      SHELL_IFRAME_SELECTORS.searchForm,
      SHELL_IFRAME_SELECTORS.vehicleSelect,
    ]

    for (const selector of selectors) {
      try {
        await this.frame.locator(selector).first().waitFor({
          state: 'visible',
          timeout: 5000,
        })
        console.log(`Found search interface with selector: ${selector}`)
        return
      } catch (error) {
        console.log(`Selector ${selector} not found, trying next...`)
      }
    }

    throw new Error('Could not find Shell search interface')
  }

  async *scrape(
    jobId: string,
    input: ScraperInput,
    onProgress: (processed: number, total: number) => void,
    checkpoint?: CheckpointState,
  ): AsyncGenerator<ScrapedItem> {
    this.jobId = jobId
    const searchTerms = input.searchTerms || []
    const total = searchTerms.length

    // Initialize or restore state
    let startIndex = 0
    let itemsScraped = 0
    
    if (checkpoint) {
      // Restore from checkpoint
      this.currentState = checkpoint
      await this.restoreBrowserStateFromCheckpoint(checkpoint.browser)
      
      startIndex = checkpoint.progress.currentSearchTermIndex
      itemsScraped = checkpoint.progress.itemsScraped
      
      console.log(`Resuming Shell scraping from checkpoint: term ${startIndex}/${total}, ${itemsScraped} items scraped`)
    } else {
      // Start fresh
      this.currentState = this.initializeState(searchTerms)
      console.log(`Starting Shell scraping for ${total} search terms`)
    }

    for (let i = startIndex; i < searchTerms.length; i++) {
      const searchTerm = searchTerms[i]

      try {
        console.log(`Processing search term ${i + 1}/${total}: "${searchTerm}"`)

        // Update state
        if (this.currentState) {
          this.currentState.progress.currentSearchTermIndex = i
          this.currentState.progress.currentResultIndex = 0
        }

        // Search for the model
        await this.searchModel(searchTerm)

        // Get search results
        const results = await this.getSearchResults()
        console.log(`Found ${results.length} results for "${searchTerm}"`)

        for (let j = 0; j < results.length; j++) {
          const result = results[j]
          
          try {
            // Update state for current result
            if (this.currentState) {
              this.currentState.progress.currentResultIndex = j
            }

            // Select the result
            await this.selectResult(result)

            // Scrape product information
            const products = await this.scrapeProducts(searchTerm, result)

            // Yield each product as a scraped item
            for (const product of products) {
              const item: ScrapedItem = {
                provider: ScrapingProvider.SHELL,
                deduplicationKey: `shell-${searchTerm}-${result.model || 'unknown'}-${product.category}-${product.name}`,
                data: {
                  searchTerm,
                  vehicle: {
                    model: result.model,
                    year: result.year,
                    specs: result.specs,
                  },
                  product: {
                    category: product.category,
                    name: product.name,
                    grade: product.grade,
                    volume: product.volume,
                    description: product.description,
                  },
                },
                rawHtml: await this.page.content(),
                metadata: {
                  url: this.page.url(),
                  timestamp: new Date(),
                  searchTerm,
                  category: product.category,
                },
              }

              // Update state with scraped item
              if (this.currentState) {
                this.currentState.progress.itemsScraped++
                this.currentState.context.lastScrapedItem = item
              }

              yield item
              this.emitItem(jobId, item)
            }

            // Navigate back to search results
            await this.navigateBack()
          } catch (error) {
            console.error(`Error processing result for "${searchTerm}":`, error)
            
            // Record error in state
            if (this.currentState) {
              this.currentState.context.errors.push({
                searchTerm,
                error: error.message,
                timestamp: new Date(),
              })
            }
            
            this.emitError(jobId, error)
            // Continue with next result
          }
        }

        // Mark search term as processed
        if (this.currentState) {
          this.currentState.progress.processedSearchTerms.push(searchTerm)
          this.currentState.progress.remainingSearchTerms = searchTerms.slice(i + 1)
          this.currentState.context.lastSuccessfulSearchTerm = searchTerm
        }

        // Clear search and prepare for next term
        await this.clearSearch()

        // Update progress
        onProgress(i + 1, total)
        this.emitProgress(jobId, i + 1, total)
        
      } catch (error) {
        console.error(`Error processing search term "${searchTerm}":`, error)
        
        // Record error in state
        if (this.currentState) {
          this.currentState.context.errors.push({
            searchTerm,
            error: error.message,
            timestamp: new Date(),
          })
        }
        
        this.emitError(jobId, error)
        // Continue with next search term
      }

      // Add delay between search terms
      await this.randomDelay()
    }

    console.log('Shell scraping completed')
  }

  private async searchModel(searchTerm: string): Promise<void> {
    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    // Try different search approaches
    try {
      // Approach 1: Direct search input
      const searchInput = this.frame.locator(SHELL_SELECTORS.searchInput).first()
      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.clear()
        await searchInput.type(searchTerm, { delay: 100 })

        const searchButton = this.frame.locator(SHELL_SELECTORS.searchButton).first()
        if (await searchButton.isVisible({ timeout: 2000 })) {
          await searchButton.click()
        } else {
          await searchInput.press('Enter')
        }
      }
    } catch (error) {
      console.log('Direct search failed, trying dropdown approach...')

      // Approach 2: Dropdown selectors
      try {
        await this.fillDropdownSearch(searchTerm)
      } catch (dropdownError) {
        console.error('Both search approaches failed:', error, dropdownError)
        throw new Error(`Could not search for "${searchTerm}"`)
      }
    }

    // Wait for results to load
    await this.waitForResults()
  }

  private async fillDropdownSearch(searchTerm: string): Promise<void> {
    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    // Parse search term (e.g., "Toyota Camry 2020")
    const parts = searchTerm.split(' ')
    const make = parts[0]
    const model = parts[1]
    const year = parts[2]

    // Try to fill vehicle dropdowns
    if (make) {
      const vehicleSelect = this.frame.locator(SHELL_IFRAME_SELECTORS.vehicleSelect).first()
      if (await vehicleSelect.isVisible({ timeout: 2000 })) {
        await vehicleSelect.selectOption({ label: make })
        await this.randomDelay(500, 1000)
      }
    }

    if (model) {
      const modelSelect = this.frame.locator(SHELL_IFRAME_SELECTORS.modelSelect).first()
      if (await modelSelect.isVisible({ timeout: 2000 })) {
        await modelSelect.selectOption({ label: model })
        await this.randomDelay(500, 1000)
      }
    }

    if (year) {
      const yearSelect = this.frame.locator(SHELL_IFRAME_SELECTORS.yearSelect).first()
      if (await yearSelect.isVisible({ timeout: 2000 })) {
        await yearSelect.selectOption({ label: year })
        await this.randomDelay(500, 1000)
      }
    }
  }

  private async waitForResults(): Promise<void> {
    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    // Wait for either results or no results message
    try {
      await Promise.race([
        this.frame.locator(SHELL_SELECTORS.resultsContainer).first().waitFor({
          state: 'visible',
          timeout: 10000,
        }),
        this.frame.locator(SHELL_SELECTORS.noResults).first().waitFor({
          state: 'visible',
          timeout: 10000,
        }),
      ])
    } catch (error) {
      console.warn('No clear results indicator found, proceeding...')
    }

    // Additional wait for loading to complete
    await this.randomDelay(1000, 2000)
  }

  private async getSearchResults(): Promise<
    Array<{ element: any; model: string; year: string; specs: Record<string, any> }>
  > {
    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    const results: Array<{ element: any; model: string; year: string; specs: Record<string, any> }> = []

    try {
      // Get all result items
      const resultElements = await this.frame.locator(SHELL_SELECTORS.resultItem).all()

      for (const element of resultElements) {
        try {
          const model = (await element.locator(SHELL_SELECTORS.modelName).first().textContent()) || 'Unknown Model'
          const year = (await element.locator(SHELL_SELECTORS.modelYear).first().textContent()) || ''

          results.push({
            element,
            model: model.trim(),
            year: year.trim(),
            specs: await this.extractSpecs(element),
          })
        } catch (error) {
          console.warn('Could not extract result details:', error)
          results.push({
            element,
            model: 'Unknown Model',
            year: '',
            specs: {},
          })
        }
      }
    } catch (error) {
      console.warn('Could not find result items, might be single result or different layout')
      // Return single dummy result to proceed
      results.push({
        element: null,
        model: 'Direct Result',
        year: '',
        specs: {},
      })
    }

    return results
  }

  private async extractSpecs(element: any): Promise<Record<string, any>> {
    const specs = {}

    try {
      // Try to extract additional specifications from the result element
      const specText = await element.textContent()
      if (specText) {
        // Parse common patterns like "2.0L", "Automatic", etc.
        const patterns = {
          engine: /(\d+\.?\d*[LlVv])/,
          transmission: /(Automatic|Manual|CVT)/i,
          fuel: /(Petrol|Diesel|Gas|Electric)/i,
        }

        for (const [key, pattern] of Object.entries(patterns)) {
          const match = specText.match(pattern)
          if (match) {
            specs[key] = match[1]
          }
        }
      }
    } catch (error) {
      console.warn('Could not extract specs:', error)
    }

    return specs
  }

  private async selectResult(result: any): Promise<void> {
    if (!result.element) {
      // If no specific element, we're already on the products page
      return
    }

    try {
      await result.element.click()
      await this.randomDelay(1000, 2000)

      // Wait for product page to load
      await this.waitForProductPage()
    } catch (error) {
      console.warn('Could not click result, proceeding to product extraction:', error)
    }
  }

  private async waitForProductPage(): Promise<void> {
    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    try {
      await this.frame.locator(SHELL_SELECTORS.productContainer).first().waitFor({
        state: 'visible',
        timeout: 10000,
      })
    } catch (error) {
      console.warn('Product container not found, checking for product sections...')

      // Try to find any product sections
      const productSections = [
        SHELL_IFRAME_SELECTORS.engineOilSection,
        SHELL_IFRAME_SELECTORS.transmissionOilSection,
        SHELL_IFRAME_SELECTORS.antifreezeSection,
      ]

      for (const section of productSections) {
        try {
          await this.frame.locator(section).first().waitFor({
            state: 'visible',
            timeout: 3000,
          })
          return // Found at least one section
        } catch (sectionError) {
          // Continue to next section
        }
      }

      console.warn('No product sections found, proceeding with extraction...')
    }
  }

  private async scrapeProducts(
    searchTerm: string,
    result: any,
  ): Promise<Array<{ category: string; name: string; grade: string; volume: string; description: string }>> {
    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    const products: Array<{ category: string; name: string; grade: string; volume: string; description: string }> = []

    // Define product categories to look for
    const categories = [
      { selector: SHELL_IFRAME_SELECTORS.engineOilSection, name: 'Engine Oil' },
      { selector: SHELL_IFRAME_SELECTORS.transmissionOilSection, name: 'Transmission Oil' },
      { selector: SHELL_IFRAME_SELECTORS.antifreezeSection, name: 'Antifreeze' },
    ]

    for (const category of categories) {
      try {
        const categoryElements = await this.frame.locator(category.selector).all()

        for (const categoryEl of categoryElements) {
          const categoryProducts = await this.extractProductsFromCategory(categoryEl, category.name)
          products.push(...categoryProducts)
        }
      } catch (error) {
        console.warn(`Could not find products for category ${category.name}:`, error)
      }
    }

    // If no categorized products found, try generic product extraction
    if (products.length === 0) {
      try {
        const genericProducts = await this.extractGenericProducts()
        products.push(...genericProducts)
      } catch (error) {
        console.warn('Generic product extraction also failed:', error)
      }
    }

    return products
  }

  private async extractProductsFromCategory(
    categoryElement: any,
    categoryName: string,
  ): Promise<Array<{ category: string; name: string; grade: string; volume: string; description: string }>> {
    const products: Array<{ category: string; name: string; grade: string; volume: string; description: string }> = []

    try {
      const productElements = await categoryElement.locator(SHELL_SELECTORS.productItem).all()

      for (const productEl of productElements) {
        try {
          const name = (await productEl.locator(SHELL_SELECTORS.productName).first().textContent()) || 'Unknown Product'
          const grade = (await productEl.locator(SHELL_SELECTORS.productGrade).first().textContent()) || ''
          const volume = (await productEl.locator(SHELL_SELECTORS.productVolume).first().textContent()) || ''
          const description = (await productEl.locator(SHELL_SELECTORS.productDescription).first().textContent()) || ''

          products.push({
            category: categoryName,
            name: name.trim(),
            grade: grade.trim(),
            volume: volume.trim(),
            description: description.trim(),
          })
        } catch (error) {
          console.warn('Could not extract product details:', error)
        }
      }
    } catch (error) {
      console.warn(`Could not extract products from category ${categoryName}:`, error)
    }

    return products
  }

  private async extractGenericProducts(): Promise<
    Array<{ category: string; name: string; grade: string; volume: string; description: string }>
  > {
    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    const products: Array<{ category: string; name: string; grade: string; volume: string; description: string }> = []

    try {
      // Try to find any product cards or recommendations
      const productCards = await this.frame.locator(SHELL_IFRAME_SELECTORS.productCard).all()

      for (const card of productCards) {
        try {
          const title = (await card.locator(SHELL_IFRAME_SELECTORS.productTitle).first().textContent()) || 'Product'
          const specs = (await card.locator(SHELL_IFRAME_SELECTORS.productSpecs).first().textContent()) || ''

          products.push({
            category: 'General',
            name: title.trim(),
            grade: '',
            volume: '',
            description: specs.trim(),
          })
        } catch (error) {
          console.warn('Could not extract generic product:', error)
        }
      }
    } catch (error) {
      console.warn('Generic product extraction failed:', error)
    }

    return products
  }

  private async navigateBack(): Promise<void> {
    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    try {
      const backButton = this.frame.locator(SHELL_SELECTORS.backButton).first()
      if (await backButton.isVisible({ timeout: 2000 })) {
        await backButton.click()
        await this.randomDelay(1000, 2000)
        await this.waitForResults()
      } else {
        console.warn('Back button not found, using browser back')
        await this.page.goBack()
        await this.randomDelay(1000, 2000)
      }
    } catch (error) {
      console.warn('Could not navigate back:', error)
    }
  }

  private async clearSearch(): Promise<void> {
    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    try {
      const clearButton = this.frame.locator(SHELL_SELECTORS.clearButton).first()
      if (await clearButton.isVisible({ timeout: 2000 })) {
        await clearButton.click()
        await this.randomDelay(500, 1000)
      } else {
        // Try to clear search input manually
        const searchInput = this.frame.locator(SHELL_SELECTORS.searchInput).first()
        if (await searchInput.isVisible({ timeout: 2000 })) {
          await searchInput.clear()
        }
      }
    } catch (error) {
      console.warn('Could not clear search:', error)
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close()
      }
      if (this.context) {
        await this.context.close()
      }
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }

  // Checkpoint support methods
  private initializeState(searchTerms: string[]): CheckpointState {
    return {
      progress: {
        currentSearchTermIndex: 0,
        currentResultIndex: 0,
        totalSearchTerms: searchTerms.length,
        processedSearchTerms: [],
        remainingSearchTerms: [...searchTerms],
        itemsScraped: 0,
      },
      browser: {
        cookies: [],
        localStorage: {},
        sessionStorage: {},
        currentUrl: '',
      },
      context: {
        errors: [],
      },
      metadata: {
        provider: 'SHELL',
        strategyVersion: '1.0.0',
        checkpointVersion: '1.0.0',
        timestamp: new Date(),
      },
    }
  }

  private async restoreBrowserStateFromCheckpoint(browserState: any): Promise<void> {
    try {
      if (!this.context || !this.page) {
        return
      }

      // Restore cookies
      if (browserState.cookies && Array.isArray(browserState.cookies)) {
        await this.context.addCookies(browserState.cookies)
      }

      // Navigate to saved URL if it's different
      if (browserState.currentUrl && browserState.currentUrl !== this.page.url()) {
        await this.page.goto(browserState.currentUrl, {
          waitUntil: 'networkidle',
          timeout: 30000,
        })
      }

      // Restore localStorage
      if (browserState.localStorage && typeof browserState.localStorage === 'object') {
        await this.page.evaluate(localStorageData => {
          Object.keys(localStorageData).forEach(key => {
            localStorage.setItem(key, localStorageData[key])
          })
        }, browserState.localStorage)
      }

      console.log('Browser state restored from checkpoint')
    } catch (error) {
      console.error('Error restoring browser state from checkpoint:', error)
      // Don't throw - continue with current state
    }
  }

  private async captureBrowserState(): Promise<any> {
    if (!this.context || !this.page) {
      return {
        cookies: [],
        localStorage: {},
        sessionStorage: {},
        currentUrl: '',
      }
    }

    try {
      const cookies = await this.context.cookies()
      const currentUrl = this.page.url()

      // Capture localStorage
      const localStorage = await this.page.evaluate(() => {
        const items: Record<string, string> = {}
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i)
          if (key) {
            items[key] = window.localStorage.getItem(key) || ''
          }
        }
        return items
      })

      // Capture sessionStorage
      const sessionStorage = await this.page.evaluate(() => {
        const items: Record<string, string> = {}
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i)
          if (key) {
            items[key] = window.sessionStorage.getItem(key) || ''
          }
        }
        return items
      })

      return {
        cookies,
        localStorage,
        sessionStorage,
        currentUrl,
      }
    } catch (error) {
      console.error('Error capturing browser state:', error)
      return {
        cookies: [],
        localStorage: {},
        sessionStorage: {},
        currentUrl: this.page?.url() || '',
      }
    }
  }

  @OnEvent('checkpoint.requestState')
  async handleStateRequest(data: { jobId: string; timeout?: number }): Promise<void> {
    if (data.jobId === this.jobId && this.currentState) {
      try {
        // Update browser state in current state
        this.currentState.browser = await this.captureBrowserState()
        this.currentState.metadata.timestamp = new Date()

        // Emit current state
        this.eventEmitter.emit('checkpoint.stateProvided', {
          jobId: this.jobId,
          state: this.currentState,
          timestamp: new Date(),
        })
      } catch (error) {
        console.error('Error providing checkpoint state:', error)
      }
    }
  }
}
