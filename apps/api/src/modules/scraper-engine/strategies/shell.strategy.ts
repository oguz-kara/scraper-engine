import { Injectable, Logger } from '@nestjs/common'
import { Browser, Frame } from 'playwright'
import { ScrapingProvider } from '@prisma/client'
import { BaseScraperStrategy } from './base.strategy'
import { ScraperInput, ScrapedItem } from '../interfaces/scraper-strategy.interface'
import { SHELL_SELECTORS } from '../constants/shell-selectors.constants'
import { EventEmitter2 } from '@nestjs/event-emitter'

interface VehicleResult {
  brand: string
  model: string
  description: string
  years: string
  fullName: string
}

interface ProductRecommendation {
  category: string // Engine, Transmission, Coolant, etc.
  capacity?: string // e.g., "3.25 litres"
  products: Array<{
    type: string // Premium, Standard, etc.
    name: string // Product name
    dataSheets?: Array<{
      type: string // Technical, Safety
      url: string
    }>
  }>
}

@Injectable()
export class ShellScraperStrategy extends BaseScraperStrategy {
  constructor(eventEmitter: EventEmitter2) {
    super(eventEmitter)
  }
  private readonly logger = new Logger(ShellScraperStrategy.name)
  private mainUrl = 'https://www.shell.com/motorist/find-the-right-oil.html'
  private iframeSelector = 'iframe'

  private currentCategory: string = ''
  private frame: Frame | null = null

  getProvider(): ScrapingProvider {
    return ScrapingProvider.SHELL
  }

  async initialize(browser: Browser): Promise<void> {
    this.context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
      javaScriptEnabled: true,
    })

    this.page = await this.context.newPage()

    // Set console logging for debugging
    this.page.on('console', msg => {
      this.logger.debug(`[Shell Browser Console] ${msg.type()}: ${msg.text()}`)
    })

    // Use reasonable timeouts
    // this.page.setDefaultNavigationTimeout(60000)
    // this.page.setDefaultTimeout(30000)

    // Navigate to Shell main page
    this.logger.log('Navigating to Shell website...')
    await this.page.goto(this.mainUrl, {
      waitUntil: 'load',
      timeout: 10000,
    })

    // Handle cookie consent if present
    await this.acceptCookiesIfPresent()

    // Wait for and setup iframe
    await this.setupIframe()

    this.logger.log('Shell page loaded successfully')
  }

  private async acceptCookiesIfPresent(): Promise<void> {
    try {
      const selectors = [
        '#onetrust-accept-btn-handler',
        'button#onetrust-accept-btn-handler',
        'button:has-text("Accept optional cookies")',
        'button:has-text("Accept All")',
        'button:has-text("Accept all")',
        'button:has-text("Accept")',
        '[data-testid="cookie-accept"]',
        '[aria-label*="accept"]',
      ]

      // Poll up to 8s for cookie banner
      const start = Date.now()
      while (Date.now() - start < 8000) {
        // If a known cookie banner heading is present, try accept
        const bannerVisible = await this.page
          .locator('#about-cookies-on-this-site, h3:has-text("About Cookies")')
          .first()
          .isVisible({ timeout: 250 })
          .catch(() => false)

        for (const sel of selectors) {
          const el = this.page.locator(sel).first()
          if (await el.isVisible({ timeout: 250 }).catch(() => false)) {
            await el.click({ timeout: 1000 }).catch(() => {})
            this.logger.log(`Cookie consent accepted via selector: ${sel}`)
            return
          }
        }

        if (!bannerVisible) {
          // No banner yet; short wait and retry
          await this.page.waitForTimeout(250)
        } else {
          // Banner visible but accept not yet; wait a bit
          await this.page.waitForTimeout(400)
        }
      }
    } catch {
      // ignore
    }
  }

  private async handleDisclaimerIfPresent(): Promise<void> {
    try {
      const continueSelectors = [
        'button[title="Continue"]',
        'button.button-1eqGhzF',
        '.button-wrapper-1M2f58f button',
        '.notification-3iy3QvK button[title="Continue"]',
        '.notification-3iy3QvK button.button-1eqGhzF',
        'div[role="document"] button:has-text("Continue")',
        'button:has-text("Continue")',
      ]

      const containerSelector = '[role="alertdialog"], [role="document"], .notification-3iy3QvK, .content-2VWe7VV'

      // Poll up to 15s for disclaimer to appear
      const start = Date.now()
      while (Date.now() - start < 15000) {
        const modalContainer = this.page.locator(containerSelector).first()
        this.logger.log('modalContainer', modalContainer)
        const hasModal = await modalContainer.isVisible({ timeout: 250 }).catch(() => false)
        this.logger.log('hasModal', hasModal)
        if (!hasModal) {
          await this.page.waitForTimeout(250)
          continue
        }

        // Try role-based within container first
        const roleBtn = modalContainer.getByRole('button', { name: /Continue/i }).first()
        this.logger.log('roleBtn', roleBtn)
        if (await roleBtn.isVisible({ timeout: 200 }).catch(() => false)) {
          await roleBtn.scrollIntoViewIfNeeded().catch(() => {})
          const clicked = await roleBtn
            .click({ timeout: 800, force: true })
            .then(() => true)
            .catch(() => false)
          this.logger.log('clicked', clicked)
          if (!clicked) {
            await roleBtn.dispatchEvent('click').catch(() => {})
            await this.page.keyboard.press('Enter').catch(() => {})
          }
          this.logger.log('Disclaimer dismissed via role=button name=Continue')
          await modalContainer.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
          return
        }

        // Try CSS selectors next
        for (const sel of continueSelectors) {
          const btn = this.page.locator(sel).first()
          this.logger.log('btn', btn)
          if (await btn.isVisible({ timeout: 200 }).catch(() => false)) {
            await btn.scrollIntoViewIfNeeded().catch(() => {})
            const clicked = await btn
              .click({ timeout: 800, force: true })
              .then(() => true)
              .catch(() => false)
            this.logger.log('clicked', clicked)
            if (!clicked) {
              await btn.dispatchEvent('pointerdown').catch(() => {})
              await btn.dispatchEvent('pointerup').catch(() => {})
              await btn.dispatchEvent('click').catch(() => {})
              await this.page.keyboard.press('Enter').catch(() => {})
            }
            this.logger.log(`Disclaimer dismissed via selector: ${sel}`)
            await modalContainer.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
            return
          }
        }

        // As a last resort, click by text within container
        const textBtn = modalContainer.locator('button:has-text("Continue"), :text("Continue")').first()
        this.logger.log('textBtn', textBtn)
        if (await textBtn.isVisible({ timeout: 200 }).catch(() => false)) {
          await textBtn.click({ timeout: 800, force: true }).catch(() => {})
          this.logger.log('Disclaimer dismissed via text locator')
          await modalContainer.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
          return
        }

        await this.page.waitForTimeout(300)
      }

      // If still present, attempt JS-based click/remove as extreme fallback
      const removed = await this.page
        .evaluate(selector => {
          const container = document.querySelector(selector)
          if (!container) return false
          // Try multiple button selectors in order of specificity
          const btn =
            container.querySelector('button[title="Continue"]') ||
            container.querySelector('button.button-1eqGhzF') ||
            container.querySelector('.button-wrapper-1M2f58f button') ||
            container.querySelector('.notification-3iy3QvK button[title="Continue"]') ||
            container.querySelector('.notification-3iy3QvK button.button-1eqGhzF') ||
            container.querySelector('button')
          if (btn) {
            // Try clicking first
            btn.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
            btn.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
            // Also try programmatic click
            if (btn instanceof HTMLButtonElement && typeof btn.click === 'function') {
              btn.click()
            }
            return true
          }
          // Remove overlay to proceed
          if (container instanceof HTMLElement) {
            container.style.setProperty('display', 'none', 'important')
            container.style.setProperty('visibility', 'hidden', 'important')
            container.style.setProperty('pointer-events', 'none', 'important')
            container.remove()
            return true
          }
          return false
        }, containerSelector)
        .catch(() => false)
      this.logger.log('removed', removed)
      if (removed) {
        this.logger.log('Disclaimer handled via JS fallback')
      }
    } catch {
      // ignore
    }
  }

  private async setupIframe(): Promise<void> {
    try {
      // Wait for iframe to be present
      await this.page.waitForSelector(this.iframeSelector, {
        state: 'attached',
        timeout: 5000,
      })

      this.logger.log('Iframe found, waiting for content frame')

      // Get the iframe frame object
      const iframeElement = await this.page.$(this.iframeSelector)
      console.log('iframeElement', iframeElement)
      if (!iframeElement) {
        throw new Error('Iframe element not found')
      }

      this.logger.log('Iframe element found, getting content frame')

      this.frame = await iframeElement.contentFrame()
      if (!this.frame) {
        throw new Error('Could not access iframe content')
      }

      this.logger.log('Iframe content frame found, waiting for domcontentloaded')

      // Wait for iframe content to load
      await this.frame.waitForLoadState('domcontentloaded', { timeout: 3000 })

      this.logger.log('Shell iframe loaded successfully')

      // Handle disclaimer within iframe if present
      await this.handleDisclaimerIfPresent()

      this.logger.log('Shell iframe loaded successfully')

      // Wait for the search interface to be ready
      await this.waitForSearchInterface()
    } catch (error) {
      this.logger.error(`Failed to setup Shell iframe: ${(error as Error)?.message}`)
      throw new Error(`Shell iframe setup failed: ${error.message}`)
    }
  }

  private async waitForSearchInterface(): Promise<void> {
    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    try {
      this.logger.log(`Waiting for selector: ${SHELL_SELECTORS.searchInput2}`)
      await this.frame.waitForSelector(SHELL_SELECTORS.searchInput2, {
        state: 'visible',
        timeout: 3000,
      })
      this.logger.log(`Found search interface with selector: ${SHELL_SELECTORS.searchInput2}`)
      return
    } catch (error) {
      this.logger.debug(`Selector ${SHELL_SELECTORS.searchInput2} not found, trying next...`)
    }

    // If no specific selectors found, just wait for iframe to be ready
    await this.frame.waitForTimeout(1000)
    this.logger.warn('Could not find specific Shell search interface, proceeding anyway')
  }

  async *scrape(
    jobId: string,
    input: ScraperInput,
    onProgress: (processed: number, total: number) => void,
    _checkpoint?: any,
  ): AsyncGenerator<ScrapedItem> {
    const searchTerms = input.searchTerms || []
    const categories = input.categories || ['Cars'] // Default to Cars if not specified

    let totalProcessed = 0
    const totalEstimated = searchTerms.length * categories.length

    // Process each category
    for (const category of categories) {
      this.currentCategory = category

      // Navigate to category
      await this.selectCategory(category)

      // Process each search term in this category
      for (const searchTerm of searchTerms) {
        try {
          this.logger.log(`Processing: ${category} - ${searchTerm}`)

          // Search for the vehicle
          await this.searchVehicle(searchTerm)

          // Get all results
          const results = await this.getSearchResults()
          this.logger.log(`Found ${results.length} results for "${searchTerm}"`)

          // Process each result
          for (const result of results) {
            try {
              // Click on the result
              await this.selectVehicle(result)

              // Extract recommendations
              const recommendations = await this.extractRecommendations()

              // Create scraped item for each recommendation
              for (const recommendation of recommendations) {
                const item: ScrapedItem = {
                  provider: ScrapingProvider.SHELL,
                  deduplicationKey: `${category}-${result.fullName}-${recommendation.category}`,
                  data: {
                    category: this.currentCategory,
                    searchTerm,
                    vehicle: {
                      brand: result.brand,
                      model: result.model,
                      description: result.description,
                      years: result.years,
                      fullName: result.fullName,
                    },
                    recommendation,
                  },
                  rawHtml: await this.page.content(),
                  metadata: {
                    url: this.page.url(),
                    timestamp: new Date(),
                    searchTerm,
                  },
                }

                yield item
                this.emitItem(jobId, item)
              }

              // Navigate back to results
              await this.navigateBackToResults()
            } catch (error) {
              this.logger.error(`Error processing vehicle ${result.fullName}: ${(error as Error)?.message}`)
              // Continue with next result
            }
          }

          // Clear search for next term
          await this.clearSearch()
        } catch (error) {
          this.logger.error(`Error processing search term "${searchTerm}": ${(error as Error)?.message}`)
          // Continue with next search term
        }

        totalProcessed++
        onProgress(totalProcessed, totalEstimated)

        // Add delay between searches
        await this.randomDelay(2000, 4000)
      }

      // Navigate back to categories
      await this.navigateToHome()
    }
  }

  private async selectCategory(category: string): Promise<void> {
    this.logger.log(`Selecting category: ${category}`)

    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    // If search form is already visible, skip category selection
    const hasSearchForm = await this.frame.$(SHELL_SELECTORS.searchForm).catch(() => null)
    if (hasSearchForm) {
      this.logger.log('Search form already visible, skipping category selection')
      return
    }

    // Wait for categories list to be available
    try {
      await this.frame.waitForSelector(SHELL_SELECTORS.categoriesList, { timeout: 3000 })
    } catch (error) {
      // Categories list might not be present, check for search form or dropdowns
      const searchForm = await this.frame.$(SHELL_SELECTORS.searchForm).catch(() => null)
      const makeDropdown = await this.frame.$('select[name*="make"]').catch(() => null)

      if (searchForm || makeDropdown) {
        this.logger.log('Direct search interface found, skipping category selection')
        return
      }

      throw new Error(`Could not find categories list or search interface: ${error.message}`)
    }

    // Try to click the category
    const categorySelector = `${SHELL_SELECTORS.categoryItems}:has-text("${category}")`

    try {
      const categoryElement = this.frame.locator(categorySelector).first()
      if (await categoryElement.isVisible({ timeout: 3000 })) {
        await categoryElement.click()
        this.logger.log(`Category ${category} clicked successfully`)

        // Wait for search form to appear after category selection
        await this.frame.waitForSelector(SHELL_SELECTORS.searchForm, { timeout: 3000 })
        this.logger.log(`Category ${category} selected - search form appeared`)
        return
      }
    } catch (error) {
      this.logger.warn(`Could not click category ${category} with text selector: ${error.message}`)
    }

    // Fallback: try to find category by role
    try {
      const roleOption = this.frame.getByRole('option', { name: new RegExp(category, 'i') }).first()
      if (await roleOption.isVisible({ timeout: 2000 })) {
        await roleOption.click()
        this.logger.log(`Category ${category} selected via role`)
        await this.frame.waitForSelector(SHELL_SELECTORS.searchForm, { timeout: 3000 })
        return
      }
    } catch (error) {
      this.logger.warn(`Could not select category ${category} via role: ${error.message}`)
    }

    // Log available categories for debugging
    try {
      const categoryItems = this.frame.locator(SHELL_SELECTORS.categoryItems)
      const count = await categoryItems.count()
      if (count > 0) {
        const availableCategories: string[] = []
        for (let i = 0; i < Math.min(count, 10); i++) {
          const text = await categoryItems
            .nth(i)
            .textContent()
            .catch(() => '')
          if (text) {
            availableCategories.push(text.trim())
          }
        }
        this.logger.warn(`Category '${category}' not found. Available categories: ${availableCategories.join(' | ')}`)
      }
    } catch (error) {
      this.logger.warn(`Could not list available categories: ${(error as Error)?.message}`)
    }

    // Check if we can proceed without explicit category selection
    const searchFormNow = await this.frame.$(SHELL_SELECTORS.searchForm).catch(() => null)
    const makeDropdownNow = await this.frame.$('select[name*="make"]').catch(() => null)

    if (searchFormNow || makeDropdownNow) {
      this.logger.log('Search interface available, proceeding without explicit category selection')
      return
    }

    throw new Error(`Could not select category: ${category}`)
  }

  private async searchVehicle(searchTerm: string): Promise<void> {
    this.logger.log(`Searching for: ${searchTerm}`)

    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    // Try search input approach first (like your working code)
    const searchInput = await this.frame.$(SHELL_SELECTORS.searchInput).catch(() => null)

    if (searchInput) {
      await searchInput.click({ clickCount: 3 }) // Select all
      await searchInput.type(searchTerm, { delay: 100 })

      // Wait for autocomplete suggestions
      await this.frame.waitForTimeout(1500)

      // Submit search
      const submitButton = await this.frame.$(SHELL_SELECTORS.searchSubmitButton)
      if (submitButton) {
        await submitButton.click()
      } else {
        // Fallback: press Enter
        await searchInput.press('Enter')
      }

      // Wait for results to load
      await this.waitForResultsInIframe()
      this.logger.log(`Search completed for: ${searchTerm}`)
      return
    }

    // Fallback: use dropdown-based form flow (like your working FormInteractorService)
    await this.searchViaDropdownInIframe(searchTerm)
  }

  private async waitForResultsInIframe(): Promise<void> {
    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    try {
      // Wait for either results wrapper or recommendation page
      await Promise.race([
        this.frame.waitForSelector(SHELL_SELECTORS.resultsWrapper, { timeout: 5000 }),
        this.frame.waitForSelector(SHELL_SELECTORS.recommendationTitle, { timeout: 5000 }),
      ])

      // Wait for loading indicator to disappear
      await this.frame.waitForFunction(
        () => {
          const loader = document.querySelector('span[data-icon="loader"]') as HTMLElement
          return !loader || loader.style.display === 'none'
        },
        { timeout: 3000 },
      )

      // Ensure results wrapper (if present) is interactable (no fade/overlay)
      await this.frame.waitForFunction(
        () => {
          const list = document.querySelector('ul.results-3t4ZeVL')
          const wrapper = list?.closest('div.results-wrapper-xweNxh5') as HTMLElement | null
          if (!wrapper) return true
          const style = window.getComputedStyle(wrapper)
          const fullyVisible = style.opacity === '1' && style.visibility !== 'hidden'
          const clickable = style.pointerEvents !== 'none'
          return fullyVisible && clickable
        },
        { timeout: 3000 },
      )
    } catch (error) {
      // If specific selectors fail, wait for network idle
      await this.frame.waitForLoadState('networkidle', { timeout: 5000 })
    }

    // Additional wait for stability
    await this.frame.waitForTimeout(500)
  }

  private async searchViaDropdownInIframe(searchTerm: string): Promise<void> {
    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    this.logger.log(`Searching via dropdowns in iframe for: ${searchTerm}`)

    const parts = searchTerm.split(' ').filter(Boolean)
    const makePart = parts[0] || ''
    const modelPart = parts[1] || ''
    const yearPart = parts.find(p => /\d{4}/.test(p)) || ''

    // Find and interact with make dropdown
    const makeDropdown = await this.findDropdownInIframe('make')
    if (!makeDropdown) {
      throw new Error('Make dropdown not found in iframe')
    }

    // Select make
    await this.selectDropdownOptionByTextInIframe(makeDropdown, makePart)
    await this.frame.waitForTimeout(1000) // Wait for model dropdown to populate

    // Select model if available
    if (modelPart) {
      const modelDropdown = await this.findDropdownInIframe('model')
      if (modelDropdown) {
        await this.selectDropdownOptionByTextInIframe(modelDropdown, modelPart)
        await this.frame.waitForTimeout(800)
      }
    }

    // Select year if available
    if (yearPart) {
      const yearDropdown = await this.findDropdownInIframe('year')
      if (yearDropdown) {
        await this.selectDropdownOptionByTextInIframe(yearDropdown, yearPart)
        await this.frame.waitForTimeout(500)
      }
    }

    // Submit form
    const submitButton = await this.findSubmitButtonInIframe()
    if (!submitButton) {
      throw new Error('Submit button not found in iframe')
    }

    await submitButton.click()
    await this.waitForResultsInIframe()
  }

  private async findDropdownInIframe(type: 'make' | 'model' | 'year' | 'engine'): Promise<any> {
    if (!this.frame) return null

    let selectors: string[]
    switch (type) {
      case 'make':
        selectors = [
          'select[name*="make"]',
          'select[name*="brand"]',
          '[data-testid="make-selector"]',
          '#make',
          '#brand',
          '.make-dropdown select',
        ]
        break
      case 'model':
        selectors = ['select[name*="model"]', '[data-testid="model-selector"]', '#model', '.model-dropdown select']
        break
      case 'year':
        selectors = ['select[name*="year"]', '[data-testid="year-selector"]', '#year', '.year-dropdown select']
        break
      case 'engine':
        selectors = [
          'select[name*="engine"]',
          'select[name*="motor"]',
          '[data-testid="engine-selector"]',
          '#engine',
          '#motor',
        ]
        break
    }

    for (const sel of selectors) {
      const el = await this.frame.$(sel).catch(() => null)
      if (el && (await el.isVisible().catch(() => false))) {
        return el
      }
    }
    return null
  }

  private async findSubmitButtonInIframe(): Promise<any> {
    if (!this.frame) return null

    const selectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      '[data-testid="submit"]',
      '[data-testid="find-oil"]',
      'button:has-text("Find")',
      'button:has-text("Search")',
      'button:has-text("Submit")',
      '.submit-button',
      '.find-oil-button',
      SHELL_SELECTORS.searchSubmitButton,
    ]

    for (const sel of selectors) {
      const el = await this.frame.$(sel).catch(() => null)
      if (el && (await el.isVisible().catch(() => false))) {
        return el
      }
    }
    return null
  }

  private async selectDropdownOptionByTextInIframe(dropdown: any, textPart: string): Promise<void> {
    try {
      // Get all options
      const options = await dropdown.$$('option')

      // First pass: look for exact or partial match
      for (const opt of options) {
        const text = await opt.textContent().catch(() => '')
        const value = await opt.getAttribute('value').catch(() => '')

        if (!text || !value || this.isPlaceholderOption(text)) continue

        if (text.toLowerCase().includes(textPart.toLowerCase())) {
          try {
            await dropdown.selectOption({ value })
            this.logger.debug(`Selected dropdown option: ${text}`)
            return
          } catch {
            // Fallback: try clicking the option
            await opt.click().catch(() => {})
            return
          }
        }
      }

      // Second pass: select first valid option as fallback
      for (const opt of options) {
        const text = await opt.textContent().catch(() => '')
        const value = await opt.getAttribute('value').catch(() => '')

        if (text && value && !this.isPlaceholderOption(text)) {
          try {
            await dropdown.selectOption({ value })
            this.logger.debug(`Selected fallback dropdown option: ${text}`)
            return
          } catch {
            await opt.click().catch(() => {})
            return
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to select dropdown option for "${textPart}": ${(error as Error)?.message}`)
    }
  }

  private isPlaceholderOption(text: string): boolean {
    const placeholderPatterns = [/^select/i, /^choose/i, /^pick/i, /^please/i, /^--/, /^\s*$/, /^all$/i]

    return placeholderPatterns.some(pattern => pattern.test(text.trim()))
  }

  private async getSearchResults(): Promise<VehicleResult[]> {
    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    // Wait for results to be visible
    try {
      await this.frame.waitForSelector(SHELL_SELECTORS.resultItems, { timeout: 10000 })
    } catch (error) {
      // Check if we went directly to recommendation page (single result)
      const hasRecommendation = await this.frame.$(SHELL_SELECTORS.recommendationTitle).catch(() => null)
      if (hasRecommendation) {
        this.logger.log('Single result found, went directly to recommendation page')
        return [
          {
            brand: 'Unknown',
            model: 'Direct Result',
            description: '',
            years: '',
            fullName: 'Direct Result',
          },
        ]
      }
      throw new Error(`Search results not found: ${error.message}`)
    }

    const results = await this.frame.evaluate(selectors => {
      const items = document.querySelectorAll(selectors.resultItems)
      const vehicleResults: any[] = []

      items.forEach((item: any) => {
        const modelElement = item.querySelector('p.car-type-1CWK6Cg')
        const descElement = item.querySelector('div.model-info-w7JYTCw p:nth-child(2)')
        const yearsElement = item.querySelector('p.years-1dxTdAt')

        if (modelElement) {
          const modelText = modelElement.textContent?.trim() || ''
          const brand = modelText.split(' ')[0]

          vehicleResults.push({
            brand: brand,
            model: modelText,
            description: descElement?.textContent?.trim() || '',
            years: yearsElement?.textContent?.trim() || '',
            fullName: `${modelText} ${descElement?.textContent?.trim() || ''}`,
          })
        }
      })

      return vehicleResults
    }, SHELL_SELECTORS)

    this.logger.log(`Found ${results.length} search results`)
    return results
  }

  private async debugResultsState(): Promise<void> {
    if (!this.frame) {
      return
    }

    const state = await this.frame.evaluate(() => {
      const results = document.querySelectorAll('li.result-item-2YEGk_G')
      const data: any[] = []

      results.forEach((item, index) => {
        const model = item.querySelector('p.car-type-1CWK6Cg')?.textContent
        const button = item.querySelector('button')
        const buttonClasses = button?.className
        const buttonVisible = button ? window.getComputedStyle(button).display !== 'none' : false

        data.push({
          index,
          model,
          hasButton: !!button,
          buttonClasses,
          buttonVisible,
          itemClasses: item.className,
        })
      })

      return data
    })

    this.logger.log('Results state:', JSON.stringify(state, null, 2))
  }

  private async selectVehicleSimple(vehicle: VehicleResult): Promise<void> {
    this.logger.log(`Selecting vehicle (simple): ${vehicle.fullName}`)

    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    // Wait for results to be ready
    await this.frame.waitForTimeout(2000)

    // Get all result items
    const resultItems = await this.frame.$$('li.result-item-2YEGk_G')

    this.logger.log(`Found ${resultItems.length} result items`)

    // Try to click each one until we find the right one
    for (let i = 0; i < resultItems.length; i++) {
      const item = resultItems[i]

      // Check if this is the right item
      const modelText = await item.$eval('p.car-type-1CWK6Cg, mark', el => el.textContent).catch(() => '')

      if (modelText && modelText.includes(vehicle.model)) {
        this.logger.log(`Found matching item at index ${i}: ${modelText}`)

        // Find any clickable element within
        const clickableElements = await item.$$('button, a, [role="button"]')

        for (const element of clickableElements) {
          try {
            // Check if element is visible
            const isVisible = await element.isVisible()
            if (!isVisible) continue

            // Try to click
            await element.click({ timeout: 2000 })
            this.logger.log('Successfully clicked element')

            // Wait a bit to see if navigation happens
            await this.frame.waitForTimeout(1000)

            // Check if we navigated
            const onRecommendation = await this.frame.$('h1:has-text("Recommendation")').catch(() => null)
            if (onRecommendation) {
              this.logger.log('Successfully navigated to recommendation page')
              return
            }
          } catch (e) {
            this.logger.warn(`Click attempt failed: ${e.message}`)
            continue
          }
        }
      }
    }

    throw new Error('Could not click any result item')
  }

  private async selectVehicle(vehicle: VehicleResult): Promise<void> {
    this.logger.log(`Selecting vehicle: ${vehicle.fullName}`)

    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    // If already on recommendation page, skip
    if (vehicle.model === 'Direct Result' || vehicle.model.includes('Direct')) {
      this.logger.log('Already on recommendation page')
      return
    }

    // Wait a bit for results to be fully interactive
    await this.frame.waitForTimeout(1000)

    // Debug: Log the current state of results
    await this.debugResultsState()

    let clicked = false

    // Method 1: Click using Playwright locator with pre-flight checks
    try {
      this.logger.log(`Trying to click result with text: ${vehicle.model}`)

      // Find the result item container first
      const resultItemSelector = `li.result-item-2YEGk_G:has-text("${vehicle.model.replace(/"/g, '\\"')}")`

      this.logger.log(`Result item selector: ${resultItemSelector}`)

      // Wait for it to be visible
      await this.frame.waitForSelector(resultItemSelector, {
        state: 'visible',
        timeout: 5000,
      })

      // Now find the clickable button within
      const buttonSelector = `${resultItemSelector} button.result-link-efvsTu3`

      this.logger.log(`Button selector: ${buttonSelector}`)

      const buttonLocator = this.frame.locator(buttonSelector).first()

      // Ensure visible and scrolled into view
      await buttonLocator.waitFor({ state: 'visible', timeout: 5000 })
      await buttonLocator.scrollIntoViewIfNeeded()
      await buttonLocator.hover({ timeout: 1000 }).catch(() => {})

      // Ensure element is actually clickable (not disabled/covered)
      await this.frame.waitForFunction(
        sel => {
          const btn = document.querySelector(sel)
          if (!btn) return false
          const rect = btn.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) return false
          const style = window.getComputedStyle(btn)
          // If button element, ensure not disabled
          if ((btn as HTMLButtonElement).disabled === true) return false
          if (style.visibility === 'hidden' || style.display === 'none' || style.pointerEvents === 'none') return false
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const topEl = document.elementFromPoint(cx, cy)
          return !!topEl && (topEl === btn || btn.contains(topEl))
        },
        buttonSelector,
        { timeout: 5000 },
      )

      // Try normal click first
      await buttonLocator.click({ timeout: 3000 })
      clicked = true
      this.logger.log('Clicked result using normal locator click')
    } catch (error) {
      this.logger.warn(`Primary locator click failed: ${error.message}`)

      // Fallback A: force click
      try {
        const buttonLocator = this.frame
          .locator(
            `li.result-item-2YEGk_G:has-text("${vehicle.model.replace(/"/g, '\\"')}") button.result-link-efvsTu3`,
          )
          .first()
        await buttonLocator.scrollIntoViewIfNeeded()
        await buttonLocator.click({ timeout: 3000, force: true })
        clicked = true
        this.logger.log('Clicked result using force click')
      } catch (forceErr) {
        this.logger.warn(`Force click failed: ${forceErr.message}`)

        // Fallback B: mouse click at element center (simulate full pointer sequence)
        try {
          const buttonLocator = this.frame
            .locator(
              `li.result-item-2YEGk_G:has-text("${vehicle.model.replace(/"/g, '\\"')}") button.result-link-efvsTu3`,
            )
            .first()
          const box = await buttonLocator.boundingBox()
          if (box) {
            const cx = box.x + box.width / 2
            const cy = box.y + box.height / 2
            await this.page.mouse.move(cx, cy)
            await this.page.mouse.down()
            await this.page.mouse.up()
            clicked = true
            this.logger.log('Clicked result using mouse events at center')
          }
        } catch (mouseErr) {
          this.logger.warn(`Mouse-event click failed: ${mouseErr.message}`)
        }
      }
    }

    // Method 2: Use JavaScript click in the browser context
    if (!clicked) {
      try {
        clicked = await this.frame.evaluate(searchModel => {
          console.log('Looking for result with model:', searchModel)

          // Find all result items
          const items = document.querySelectorAll('li.result-item-2YEGk_G')
          console.log('Found result items:', items.length)

          for (const item of items) {
            // Find model text in various possible locations
            const modelEl =
              item.querySelector('p.car-type-1CWK6Cg') ||
              item.querySelector('mark') ||
              item.querySelector('.model-info-w7JYTCw p:first-child')

            const modelText = modelEl?.textContent?.trim() || ''
            console.log('Checking model text:', modelText)

            if (modelText && modelText.includes(searchModel)) {
              console.log('Found matching model!')

              // Find the button to click
              const button =
                item.querySelector('button.result-link-efvsTu3') ||
                item.querySelector('button.button') ||
                item.querySelector('button')

              if (button) {
                console.log('Found button, clicking...')
                // Scroll into view first
                button.scrollIntoView({ behavior: 'instant', block: 'center' })

                // Try multiple click methods
                if (button instanceof HTMLElement) {
                  // Method 1: Direct click
                  button.click()

                  // Method 2: Dispatch click event
                  const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                  })
                  button.dispatchEvent(clickEvent)

                  return true
                }
              } else {
                // If no button found, try clicking the item itself
                console.log('No button found, clicking item directly')
                if (item instanceof HTMLElement) {
                  item.click()
                  return true
                }
              }
            }
          }

          console.log('No matching result found')
          return false
        }, vehicle.model)

        if (clicked) {
          this.logger.log('Clicked vehicle via JavaScript evaluate')
        }
      } catch (error) {
        this.logger.warn(`JavaScript click failed: ${error.message}`)
      }
    }

    // Method 3: Try clicking by index if we know the position
    if (!clicked) {
      try {
        const results = await this.getSearchResults()
        const index = results.findIndex(r => r.model === vehicle.model)

        if (index >= 0) {
          this.logger.log(`Trying to click result at index ${index}`)

          // Click the nth result
          const nthButtonSelector = `li.result-item-2YEGk_G:nth-child(${index + 1}) button`
          await this.frame.click(nthButtonSelector, { force: true })

          clicked = true
          this.logger.log('Clicked result by index')
        }
      } catch (error) {
        this.logger.warn(`Index click failed: ${error.message}`)
      }
    }

    // Method 4: Last resort - try to find and click ANY clickable element in the result
    if (!clicked) {
      try {
        const clickableSelector = `li.result-item-2YEGk_G:has-text("${vehicle.model.replace(/"/g, '\\"')}") *:is(button, a, [role="button"])`

        const elements = await this.frame.$$(clickableSelector)
        for (const element of elements) {
          try {
            await element.click({ force: true })
            clicked = true
            this.logger.log('Clicked using wildcard selector')
            break
          } catch (e) {
            continue
          }
        }
      } catch (error) {
        this.logger.warn(`Wildcard click failed: ${error.message}`)
      }
    }

    if (!clicked) {
      // Take a screenshot for debugging
      await this.page.screenshot({
        path: `debug-click-failed-${Date.now()}.png`,
        fullPage: true,
      })

      // Log page content for debugging
      const pageContent = await this.frame.evaluate(() => {
        const results = document.querySelector('ul.results-3t4ZeVL')
        return {
          hasResults: !!results,
          resultCount: document.querySelectorAll('li.result-item-2YEGk_G').length,
          firstResultHTML: document.querySelector('li.result-item-2YEGk_G')?.outerHTML?.substring(0, 500),
        }
      })

      this.logger.error('Failed to click any result. Page state:', pageContent)
      throw new Error(`Could not click on vehicle: ${vehicle.model}`)
    }

    // Wait for navigation to recommendation page
    try {
      this.logger.log('Waiting for recommendation page to load...')

      // Wait for either the recommendation title or accordions
      await Promise.race([
        this.frame.waitForSelector(SHELL_SELECTORS.recommendationTitle, {
          state: 'visible',
          timeout: 5000,
        }),
        this.frame.waitForSelector(SHELL_SELECTORS.accordionItems, {
          state: 'visible',
          timeout: 5000,
        }),
        this.frame.waitForSelector('h1:has-text("Recommendation")', {
          state: 'visible',
          timeout: 5000,
        }),
      ])

      // Small delay for page to stabilize
      await this.frame.waitForTimeout(1000)

      this.logger.log(`Vehicle selected successfully: ${vehicle.fullName}`)
    } catch (error) {
      this.logger.error(`Failed to load recommendation page after click: ${error.message}`)

      // Check if we're still on results page
      const stillOnResults = await this.frame.$(SHELL_SELECTORS.resultsWrapper)
      if (stillOnResults) {
        this.logger.error('Still on results page, click did not navigate')
      }

      // Take screenshot for debugging
      await this.page.screenshot({
        path: `debug-no-recommendation-${Date.now()}.png`,
        fullPage: true,
      })

      throw error
    }
  }

  private async extractRecommendations(): Promise<ProductRecommendation[]> {
    this.logger.log('Extracting product recommendations')

    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    const recommendations = await this.frame.evaluate(selectors => {
      const accordions = document.querySelectorAll(selectors.accordionItems)
      const recs: any[] = []

      accordions.forEach((accordion: any) => {
        const titleEl = accordion.querySelector(selectors.accordionTitle)
        const capacityEl = accordion.querySelector(selectors.accordionCapacity)
        const _recommendationEl = accordion.querySelector(selectors.accordionRecommendation)

        if (titleEl) {
          const category = titleEl.textContent?.trim() || ''
          const capacity = capacityEl?.textContent?.trim()

          const products: any[] = []

          // Extract product recommendations
          const types = accordion.querySelectorAll(`${selectors.accordionRecommendation} dt`)
          const names = accordion.querySelectorAll(`${selectors.accordionRecommendation} dd`)

          for (let i = 0; i < types.length; i++) {
            if (types[i] && names[i]) {
              const product: any = {
                type: types[i].textContent?.trim() || '',
                name: names[i].textContent?.trim() || '',
              }

              // Extract data sheets if available
              const dataSheetLinks = accordion.querySelectorAll(`${selectors.accordionDataSheets}`)
              if (dataSheetLinks.length > 0) {
                product.dataSheets = []
                dataSheetLinks.forEach((link: any) => {
                  const type = link.querySelector('.download-label-2oIxhO5')?.textContent?.trim()
                  const url = link.href
                  if (type && url) {
                    product.dataSheets.push({ type, url })
                  }
                })
              }

              products.push(product)
            }
          }

          if (products.length > 0) {
            recs.push({
              category,
              capacity,
              products,
            })
          }
        }
      })

      return recs
    }, SHELL_SELECTORS)

    this.logger.log(`Extracted ${recommendations.length} recommendation categories`)
    return recommendations
  }

  private async navigateBackToResults(): Promise<void> {
    this.logger.log('Navigating back to results')

    if (!this.frame) {
      throw new Error('Iframe not initialized')
    }

    // Click back button
    const backButton = await this.frame.$(SHELL_SELECTORS.backButton)
    if (backButton) {
      await backButton.click()
    } else {
      this.logger.warn('Back button not found, using browser back')
      await this.page.goBack()
    }

    // Wait for results to reappear
    await this.frame
      .waitForSelector(SHELL_SELECTORS.resultsWrapper, {
        timeout: 3000,
      })
      .catch(() => {
        this.logger.warn('Results wrapper not found after back navigation')
      })

    // Small delay for stability
    await this.frame.waitForTimeout(1000)
  }

  private async clearSearch(): Promise<void> {
    this.logger.log('Clearing search')

    if (!this.frame) {
      return
    }

    // Click on search input and clear it
    const searchInput = await this.frame.$(SHELL_SELECTORS.searchInput)
    if (searchInput) {
      await searchInput.click({ clickCount: 3 })
      await searchInput.press('Backspace')
    }

    // Small delay
    await this.frame.waitForTimeout(500)
  }

  private async navigateToHome(): Promise<void> {
    this.logger.log('Navigating to home')

    if (!this.frame) {
      return
    }

    // Keep clicking back until we see categories or search form
    let attempts = 0
    while (attempts < 5) {
      try {
        // Check if we're already at home (categories visible) or can search directly
        const categoriesList = await this.frame.$(SHELL_SELECTORS.categoriesList)
        const searchForm = await this.frame.$(SHELL_SELECTORS.searchForm)
        const makeDropdown = await this.frame.$('select[name*="make"]')

        if (categoriesList || searchForm || makeDropdown) {
          this.logger.log('Home interface available')
          return
        }

        // Click back button
        const backButton = await this.frame.$(SHELL_SELECTORS.backButton)
        if (backButton) {
          await backButton.click()
          await this.frame.waitForTimeout(1000)
        } else {
          break
        }

        attempts++
      } catch {
        break
      }
    }

    // Final wait for any interface to appear
    await this.frame.waitForTimeout(2000)
    this.logger.log('Navigation to home completed')
  }

  protected async randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min)) + min
    await this.page.waitForTimeout(delay)
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close()
    }
    if (this.context) {
      await this.context.close()
    }
  }
}
