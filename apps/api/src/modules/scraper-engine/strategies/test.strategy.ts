import { Injectable, Logger } from '@nestjs/common'
import { Browser, Page } from 'playwright'
import { ScrapingProvider } from '@prisma/client'
import { BaseScraperStrategy } from './base.strategy'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ScraperInput } from '../interfaces/scraper-strategy.interface'

@Injectable()
export class TestScraperStrategy extends BaseScraperStrategy {
  constructor(eventEmitter: EventEmitter2) {
    super(eventEmitter)
  }
  private readonly logger = new Logger(TestScraperStrategy.name)
  private mainUrl =
    'https://www.shell.com/motorist/find-the-right-oil/_jcr_content/root/main/section/web_component/links/item0.stream/1748598800968/c910d877e46145bc10752a073dbb53c8b2249603/iframe.html#/gb/en-gb/search/vehicle'

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

    // Console logging disabled for cleaner browser experience

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
            const resultsSelector = 'li[data-index] .result-link-efvsTu3'
            const resultsLocator = this.page.locator(resultsSelector)
            const initialCount = await resultsLocator.count()
            this.logger.log(`Found ${initialCount} initial results`)

            // Expand all results by clicking "Load more" until exhausted
            while (true) {
              const loadMoreButton = this.page.locator('button:has-text("Load more search results")').first()
              const hasButton = (await loadMoreButton.count()) > 0
              if (!hasButton) break

              const beforeCount = await resultsLocator.count()
              await loadMoreButton.scrollIntoViewIfNeeded()
              await loadMoreButton.click()

              try {
                await this.page.waitForFunction(
                  args => {
                    const [selector, prev] = args as [string, number]
                    return document.querySelectorAll(selector).length > prev
                  },
                  [resultsSelector, beforeCount],
                  { timeout: 5000 },
                )
              } catch {
                const after = await resultsLocator.count()
                if (after <= beforeCount) {
                  this.logger.warn('No additional results appeared after clicking Load more; stopping expansion')
                  break
                }
              }
            }

            // Collect all result URLs
            const totalResults = await resultsLocator.count()
            this.logger.log(`Loaded ${totalResults} total results; collecting URLs...`)
            const urls: string[] = []
            for (let i = 0; i < totalResults; i++) {
              try {
                const href = await resultsLocator.nth(i).getAttribute('href')
                if (href) {
                  const absoluteUrl = new URL(href, this.page.url()).toString()
                  urls.push(absoluteUrl)
                }
              } catch (e) {
                this.logger.warn(`Failed to read href for result ${i + 1}: ${e instanceof Error ? e.message : e}`)
              }
            }
            this.logger.log(`Collected ${urls.length} URLs. Sample: ${urls.slice(0, 5).join(' | ')}`)

            // Fallback: if there are results but no hrefs, click-through each result sequentially
            if (urls.length === 0 && totalResults > 0) {
              this.logger.warn('No href attributes found on results; switching to click-through mode')

              let processedClickThrough = 0
              const resultsContainerSelector = 'ul.results-3t4ZeVL'
              const resultItemSelector = 'li[data-index]'

              const seenIndexes = new Set<number>()
              let safety = 0

              while (processedClickThrough < totalResults && safety < totalResults + 100) {
                safety++

                // Discover visible items' data-indexes
                let visibleIndexes: number[] = []
                try {
                  visibleIndexes = await this.page.evaluate(containerSel => {
                    const container = document.querySelector(containerSel)
                    if (!(container instanceof HTMLElement)) return []
                    const items = Array.from(container.querySelectorAll('li[data-index]'))
                    const indexes: number[] = []
                    for (const el of items) {
                      if (!(el instanceof HTMLElement)) continue
                      const val = Number(el.getAttribute('data-index') || '-1')
                      if (Number.isFinite(val) && val >= 0) indexes.push(val)
                    }
                    return indexes
                  }, resultsContainerSelector)
                } catch (e) {
                  const errMsg = e instanceof Error ? e.message : String(e)
                  this.logger.warn(`Failed to read visible indexes: ${errMsg}`)
                }

                // If nothing visible, try to scroll down to load more
                if (visibleIndexes.length === 0) {
                  try {
                    await this.page.evaluate(containerSel => {
                      const container = document.querySelector(containerSel)
                      if (container instanceof HTMLElement) {
                        container.scrollBy({ top: container.clientHeight })
                      }
                    }, resultsContainerSelector)
                    await this.page.waitForTimeout(250)
                    continue
                  } catch (err) {
                    const errMsg = err instanceof Error ? err.message : String(err)
                    this.logger.warn(`Scroll to reveal items failed: ${errMsg}`)
                  }
                }

                // Process each visible, unseen index
                let progressedInThisPass = false
                for (const idx of visibleIndexes) {
                  if (seenIndexes.has(idx)) {
                    continue
                  }
                  const button = this.page
                    .locator(`${resultItemSelector}[data-index="${idx}"] .result-link-efvsTu3`)
                    .first()
                  const count = await button.count()
                  if (count === 0) {
                    continue
                  }

                  try {
                    await button.scrollIntoViewIfNeeded()
                    await button.click({ timeout: 5000 })

                    // Wait for recommendation
                    try {
                      await Promise.race([
                        this.page.waitForSelector('h1:has-text("Recommendation")', { timeout: 5000 }),
                        this.page
                          .waitForSelector('div[data-testid="recommendation"], .accordion-item-3Svi9jW', {
                            timeout: 5000,
                          })
                          .catch(() => null),
                      ])
                    } catch (navErr) {
                      this.logger.warn(
                        `Recommendation wait failed for index ${idx}: ${navErr instanceof Error ? navErr.message : navErr}`,
                      )
                    }

                    const pageData = await this.extractPageDataFrom(this.page, searchTerm, idx + 1)
                    if (pageData) {
                      scrapedItems.push(pageData)
                      processedClickThrough++
                    }

                    seenIndexes.add(idx)
                    progressedInThisPass = true

                    // Navigate back
                    try {
                      await this.page.goBack({ waitUntil: 'domcontentloaded' })
                    } catch (backErr) {
                      this.logger.warn(`goBack failed: ${backErr instanceof Error ? backErr.message : backErr}`)
                    }
                    try {
                      await this.page.waitForSelector(resultsContainerSelector, { timeout: 5000 })
                    } catch (waitErr) {
                      const errMsg = waitErr instanceof Error ? waitErr.message : String(waitErr)
                      this.logger.warn(`Waiting for results after back failed: ${errMsg}`)
                    }
                    await this.page.waitForTimeout(200)
                  } catch (e) {
                    this.logger.warn(`Click-through failed at data-index ${idx}: ${e instanceof Error ? e.message : e}`)
                    seenIndexes.add(idx)
                  }
                }

                // Scroll to load new items if we didn't progress enough
                if (!progressedInThisPass) {
                  try {
                    await this.page.evaluate(containerSel => {
                      const container = document.querySelector(containerSel)
                      if (container instanceof HTMLElement) {
                        container.scrollBy({ top: container.clientHeight })
                      }
                    }, resultsContainerSelector)
                    await this.page.waitForTimeout(300)
                  } catch (err) {
                    const errMsg = err instanceof Error ? err.message : String(err)
                    this.logger.warn(`Scroll to next page failed: ${errMsg}`)
                  }
                }
              }

              this.logger.log(`Click-through mode processed ${processedClickThrough}/${totalResults} results`)

              // After click-through, return items
              return scrapedItems
            }

            // Visit and extract with small concurrency pool
            const concurrencyEnv = Number(process.env.SCRAPER_CONCURRENCY || '')
            const concurrency = Number.isFinite(concurrencyEnv) && concurrencyEnv > 0 ? concurrencyEnv : 3
            this.logger.log(`Starting detail processing for ${urls.length} URLs with concurrency=${concurrency}`)

            let processed = 0
            await this.processUrlsWithConcurrency(urls, concurrency, async (url, index) => {
              this.logger.log(`→ [${index + 1}/${urls.length}] Opening detail: ${url}`)
              const detailPage = await this.context.newPage()
              try {
                await detailPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
                const pageData = await this.extractPageDataFrom(detailPage, searchTerm, index + 1)
                if (pageData) {
                  scrapedItems.push(pageData)
                  this.logger.log(`✓ [${index + 1}/${urls.length}] Extracted detail.`)
                } else {
                  this.logger.warn(`× [${index + 1}/${urls.length}] No data extracted.`)
                }
              } catch (e) {
                this.logger.warn(`Failed to process detail ${index + 1}: ${e instanceof Error ? e.message : e}`)
              } finally {
                try {
                  await detailPage.close()
                } catch (closeErr) {
                  const errMsg = closeErr instanceof Error ? closeErr.message : String(closeErr)
                  this.logger.warn(`Failed to close detail page: ${errMsg}`)
                }
                processed++
              }
            })

            this.logger.log(`Finished processing ${processed}/${urls.length} detail pages`)

            // If we collected URLs but processed none, expose clear diagnostics
            if (urls.length > 0 && processed === 0) {
              const msg = `Collected ${urls.length} URLs but processed 0. Check selectors, navigation, or network.`
              this.logger.error(msg)

              // Optionally pause the context for inspection
              if (process.env.DEBUG_KEEP_BROWSER_OPEN === 'true') {
                this.logger.warn('DEBUG_KEEP_BROWSER_OPEN is true; pausing 30s to inspect browser before returning...')
                await this.page.waitForTimeout(30000)
              }

              // Optionally fail the job to surface the issue in UI
              if (process.env.FAIL_ON_ZERO_DETAIL === 'true') {
                throw new Error(msg)
              }
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
}
