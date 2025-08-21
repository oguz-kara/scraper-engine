import { Injectable, Logger } from '@nestjs/common'
import { Browser, Page } from 'playwright'
import { ScrapingProvider } from '@prisma/client'
import { BaseScraperStrategy } from './base.strategy'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ScraperInput } from '../interfaces/scraper-strategy.interface'

type PaginationCheckpoint = {
  currentIndex: number
  loadMoreClickCount: number
  itemsPerLoad: number | null
}

@Injectable()
export class TestScraperStrategy extends BaseScraperStrategy {
  constructor(eventEmitter: EventEmitter2) {
    super(eventEmitter)
  }
  private readonly logger = new Logger(TestScraperStrategy.name)
  private mainUrl =
    'https://www.shell.com/motorist/find-the-right-oil/_jcr_content/root/main/section/web_component/links/item0.stream/1748598800968/c910d877e46145bc10752a073dbb53c8b2249603/iframe.html#/gb/en-gb/search/vehicle'

  // Resume-aware pagination state and selectors
  private readonly resultsSelector = 'li[data-index] .result-link-efvsTu3'
  private readonly loadMoreSelector = 'button:has-text("Load more search results")'
  private paginationState: PaginationCheckpoint = {
    currentIndex: 0,
    loadMoreClickCount: 0,
    itemsPerLoad: null,
  }

  getProvider(): ScrapingProvider {
    return ScrapingProvider.TEST
  }

  async initialize(browser: Browser): Promise<void> {
    this.context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
      javaScriptEnabled: true,
    })

    // Optional Playwright tracing for deep debugging
    try {
      if (process.env.PLAYWRIGHT_TRACE === 'true') {
        await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true })
        this.logger.log('Playwright tracing started (screenshots, snapshots, sources)')
      }
    } catch (e) {
      this.logger.warn(`Failed to start tracing: ${e instanceof Error ? e.message : e}`)
    }

    this.page = await this.context.newPage()

    // Navigate to Shell main page
    this.logger.log('Navigating to Shell website...')
    await this.page.goto(this.mainUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    })

    // Wait for page to be fully loaded
    await this.page.waitForLoadState('domcontentloaded')

    // Brief wait for dynamic content
    await this.page.waitForTimeout(500)

    // Handle cookie consent if present
    this.logger.log('Checking for cookie consent...')
    await this.closeCookieConsentIfPresent()

    this.logger.log('Checking for disclaimer...')
    // Handle disclaimer if present
    await this.closeDisclaimerIfPresent()

    // Wait for the main search input to be ready, indicating page is interactive
    this.logger.log('Waiting for search input to be ready...')
    await this.page.waitForSelector('input[name="model"]', { timeout: 30000 })
    this.logger.log('Search input is ready. Initialization complete.')
  }

  async cleanup(): Promise<void> {
    // Stop tracing and save if enabled
    try {
      if (this.context && process.env.PLAYWRIGHT_TRACE === 'true') {
        const tracePath = `trace-${Date.now()}.zip`
        await this.context.tracing.stop({ path: tracePath })
        this.logger.log(`Playwright trace saved to ${tracePath}`)
      }
    } catch (e) {
      this.logger.warn(`Failed to stop/save tracing: ${e instanceof Error ? e.message : e}`)
    }
    if (this.page) {
      await this.page.close()
    }
    if (this.context) {
      await this.context.close()
    }
  }

  async *scrape(
    _jobId: string,
    _input: ScraperInput,
    _onProgress: (processed: number, total: number) => void,
    _checkpoint?: any,
  ) {
    this.logger.log('Starting test scraping...')

    // Brief wait for page to be ready
    await this.page.waitForTimeout(500)

    // Try restore pagination state
    const restored = this.extractPaginationFromCheckpoint(_checkpoint)
    if (restored) {
      this.paginationState = restored
      this.logger.log(`Restored pagination state: ${JSON.stringify(this.paginationState)}`)
    }

    // Search for Renault Clio and process all results
    const scrapedItems = await this.searchForVehicle('Renault Clio')

    this.logger.log(`Test scraping completed. Processed ${scrapedItems.length} items.`)

    // Yield each scraped item
    for (const item of scrapedItems) {
      yield item
    }
  }

  private async closeDisclaimerIfPresent() {
    try {
      // Remove disclaimer notification container if present
      const removed = await this.page.evaluate(() => {
        const container = document.querySelector('div.notification-3iy3QvK[role="alertdialog"]')
        if (container && container.parentElement) {
          container.parentElement.removeChild(container)
          return true
        }
        return false
      })

      if (removed) {
        this.logger.log('Disclaimer notification container removed from DOM')
        await this.page.waitForTimeout(100)
        return
      }

      // Fallback: try removing by content class
      const fallbackRemoved = await this.page.evaluate(() => {
        const content = document.querySelector('div.content-2VWe7VV')
        if (content) {
          const alertDialog = content.closest('div[role="alertdialog"]')
          if (alertDialog && alertDialog.parentElement) {
            alertDialog.parentElement.removeChild(alertDialog)
            return true
          }
        }
        return false
      })

      if (fallbackRemoved) {
        this.logger.log('Disclaimer fallback container removed from DOM')
        await this.page.waitForTimeout(100)
      } else {
        this.logger.log('No disclaimer container found')
      }
    } catch (error) {
      this.logger.warn(`Error handling disclaimer: ${error.message}`)
    }
  }

  private async closeCookieConsentIfPresent() {
    try {
      // Try multiple selectors for cookie consent
      const selectors = [
        'button:has-text("Accept optional cookies")',
        'button:has-text("Accept all cookies")',
        'button:has-text("Accept cookies")',
        'button:has-text("Accept")',
        'button:has-text("OK")',
        'button:has-text("Got it")',
        '[data-testid="accept-cookies"]',
        '.cookie-banner button',
        '.cookie-consent button',
        '#accept-cookies',
        '.accept-cookies',
      ]

      const combinedSelector = selectors.join(', ')
      try {
        const button = await this.page.waitForSelector(combinedSelector, { timeout: 5000 })
        if (button) {
          await button.click()
          this.logger.log(`Clicked cookie consent button.`)
          await this.page.waitForTimeout(200)
        }
      } catch {
        this.logger.log('No cookie consent button found, continuing...')
      }
    } catch (error) {
      this.logger.warn(`Error handling cookie consent: ${error.message}`)
    }
  }

  private async searchForVehicle(searchTerm: string): Promise<any[]> {
    this.logger.log(`Searching for vehicle: ${searchTerm}`)
    const scrapedItems: any[] = []

    try {
      // Wait for the search input to be available
      const searchInput = await this.page.$('input[name="model"]')

      if (searchInput) {
        // Clear the input and type the search term
        await searchInput.fill('')
        await searchInput.type(searchTerm)
        this.logger.log(`Typed "${searchTerm}" into search input`)

        // Wait a moment for autocomplete dropdown to appear
        await this.page.waitForTimeout(1000)

        // Wait for the dropdown results to appear and loop through all items
        try {
          const dropdownContainer = await this.page.waitForSelector('ul.results-3t4ZeVL', {
            timeout: 3000,
          })
          if (dropdownContainer) {
            // Use live locator to avoid stale element handles after navigation
            const resultsLocator = this.page.locator(this.resultsSelector)
            const initialCount = await resultsLocator.count()
            this.logger.log(`Found ${initialCount} initial results`)

            // Restore once to saved number of clicks and infer page size if needed
            await this.replayLoadMore(this.paginationState.loadMoreClickCount)
            await this.inferItemsPerPage()

            // Compute current block bounds
            let totalResults = await resultsLocator.count()
            let itemsPerPage = this.paginationState.itemsPerLoad ?? totalResults
            let startOfBlock = this.paginationState.loadMoreClickCount * itemsPerPage
            let i = Math.max(this.paginationState.currentIndex, startOfBlock)
            this.logger.log(`Block start=${startOfBlock}, itemsPerPage=${itemsPerPage}, i=${i}, total=${totalResults}`)

            while (true) {
              totalResults = await resultsLocator.count()
              const endOfBlock = Math.min(startOfBlock + itemsPerPage - 1, Math.max(totalResults - 1, -1))

              for (; i <= endOfBlock; i++) {
                try {
                  const resultHandle = resultsLocator.nth(i)
                  await resultHandle.scrollIntoViewIfNeeded()
                  await resultHandle.click({ timeout: 5000 })
                  try {
                    await this.page.waitForURL(u => u.toString().includes('/equipment/'), { timeout: 10000 })
                  } catch {
                    await this.page.waitForSelector(
                      'h1:has-text("Recommendation"), div[data-testid="recommendation"], .accordion-item-3Svi9jW',
                      { timeout: 10000 },
                    )
                  }
                  const pageData = await this.extractPageDataFrom(this.page, searchTerm, i + 1)
                  if (pageData) scrapedItems.push(pageData)
                  await this.page.goBack({ waitUntil: 'domcontentloaded' })
                  await this.page.waitForSelector('ul.results-3t4ZeVL', { timeout: 5000 })
                  this.paginationState.currentIndex = i + 1
                } catch (err) {
                  const msg = err instanceof Error ? err.message : String(err)
                  this.logger.warn(`Block item ${i + 1} failed: ${msg}`)
                  continue
                }
              }

              // Move to next block
              const before = await this.getResultsLocator().count()
              const after = await this.clickLoadMoreWithWait(before, 8000)
              if (after <= before) {
                this.logger.log('No more blocks to load. Finishing.')
                break
              }
              this.paginationState.loadMoreClickCount += 1
              if (this.paginationState.itemsPerLoad == null || after - before !== itemsPerPage) {
                itemsPerPage = after - before
                this.paginationState.itemsPerLoad = itemsPerPage
              }
              startOfBlock += itemsPerPage
              i = startOfBlock
            }
          } else {
            this.logger.warn('Dropdown results not found')
          }
        } catch (error) {
          this.logger.warn(`Failed to process dropdown results: ${error.message}`)
        }
      } else {
        this.logger.warn('Search input not found')
      }
    } catch (error) {
      this.logger.warn(`Failed to search for vehicle: ${error.message}`)
    }

    return scrapedItems
  }

  private async extractPageDataFrom(page: Page, searchTerm: string, resultIndex: number): Promise<any> {
    try {
      const pageData = {
        provider: ScrapingProvider.TEST,
        deduplicationKey: `renault-clio-${resultIndex}`,
        data: {
          category: 'Vehicle',
          searchTerm: searchTerm,
          vehicle: {
            brand: 'Renault',
            model: 'Clio',
            description: `Renault Clio result ${resultIndex}`,
            years: 'Various',
            fullName: 'Renault Clio',
          },
          recommendation: {
            category: 'Vehicle Parts',
            products: [
              {
                type: 'Oil',
                name: 'Shell Oil Recommendation',
              },
            ],
          },
        },
        rawHtml: await page.content(),
        metadata: {
          url: page.url(),
          timestamp: new Date(),
          searchTerm: searchTerm,
          resultIndex: resultIndex,
        },
      }

      this.logger.log(`Extracted data (new tab) for result ${resultIndex}`)
      return pageData
    } catch (error) {
      this.logger.warn(`Failed to extract data (new tab) for result ${resultIndex}: ${error.message}`)
      return null
    }
  }

  private async processUrlsWithConcurrency(
    urls: string[],
    concurrency: number,
    worker: (url: string, index: number) => Promise<void>,
  ): Promise<void> {
    const queue = urls.map((url, index) => ({ url, index }))
    const active: Promise<void>[] = []

    const runNext = async (): Promise<void> => {
      const next = queue.shift()
      if (!next) return
      await worker(next.url, next.index)
      await runNext()
    }

    const poolSize = Math.max(1, Math.min(concurrency, queue.length || concurrency))
    for (let i = 0; i < poolSize; i++) {
      active.push(runNext())
    }
    await Promise.all(active)
  }

  // ---------- Resume helpers ----------

  private extractPaginationFromCheckpoint(rawCheckpoint: any): PaginationCheckpoint | null {
    try {
      const candidates = [
        rawCheckpoint?.state?.pagination,
        rawCheckpoint?.pagination,
        rawCheckpoint?.browserState?.pagination,
      ].filter(Boolean)
      if (candidates.length > 0) {
        const p = candidates[0] as PaginationCheckpoint
        if (
          typeof p.currentIndex === 'number' &&
          typeof p.loadMoreClickCount === 'number' &&
          (typeof p.itemsPerLoad === 'number' || p.itemsPerLoad === null)
        ) {
          return { ...p }
        }
      }
    } catch {
      console.log('No pagination checkpoint found')
    }
    return null
  }

  private getResultsLocator() {
    return this.page.locator(this.resultsSelector)
  }

  private async clickLoadMoreWithWait(prevCount: number, timeoutMs = 8000): Promise<number> {
    const btn = this.page.locator(this.loadMoreSelector).first()
    if ((await btn.count()) === 0) return prevCount

    await btn.scrollIntoViewIfNeeded()
    await btn.click()

    try {
      await this.page.waitForFunction(
        args => {
          const [selector, prev] = args as [string, number]
          return document.querySelectorAll(selector).length > prev
        },
        [this.resultsSelector, prevCount],
        { timeout: timeoutMs },
      )
    } catch {
      // proceed; maybe it still loaded
    }

    return await this.getResultsLocator().count()
  }

  private async replayLoadMore(targetClicks: number): Promise<void> {
    if (targetClicks <= 0) return
    const resultsLocator = this.getResultsLocator()
    let clicks = 0
    while (clicks < targetClicks) {
      const before = await resultsLocator.count()
      const after = await this.clickLoadMoreWithWait(before, 8000)
      if (after <= before) break
      clicks++
      if (this.paginationState.itemsPerLoad == null) {
        this.paginationState.itemsPerLoad = after - before
      }
    }
  }

  private async inferItemsPerPage(): Promise<void> {
    if (this.paginationState.itemsPerLoad != null) return
    const before = await this.getResultsLocator().count()
    const after = await this.clickLoadMoreWithWait(before, 6000)
    if (after > before) {
      this.paginationState.itemsPerLoad = after - before
      this.paginationState.loadMoreClickCount += 1
    }
  }

  private async restorePaginationState(pagination: PaginationCheckpoint): Promise<void> {
    const targetClicks = pagination.loadMoreClickCount
    if (targetClicks <= 0) return

    let currentCount = await this.getResultsLocator().count()
    for (let i = 0; i < targetClicks; i++) {
      const before = currentCount
      currentCount = await this.clickLoadMoreWithWait(before, 8000)

      // Infer itemsPerLoad on first successful click
      if (pagination.itemsPerLoad == null && currentCount > before) {
        pagination.itemsPerLoad = currentCount - before
      }
    }
  }

  private async expandToIndex(targetIndex: number): Promise<void> {
    let count = await this.getResultsLocator().count()
    while (count <= targetIndex) {
      const before = count
      const after = await this.clickLoadMoreWithWait(before, 8000)
      if (after <= before) {
        throw new Error(`Cannot expand results to reach index ${targetIndex}; stuck at ${after}`)
      }
      count = after
      this.paginationState.loadMoreClickCount += 1

      if (this.paginationState.itemsPerLoad == null && after > before) {
        this.paginationState.itemsPerLoad = after - before
      }
    }
  }

  async saveBrowserState(): Promise<any> {
    const base = await super.saveBrowserState()
    return {
      ...base,
      pagination: { ...this.paginationState },
    }
  }
}
