import { Injectable, Logger } from '@nestjs/common'
import { Browser } from 'playwright'
import { ScrapedItem, ScrapingProvider } from '@prisma/client'
import { BaseScraperStrategy } from './base.strategy'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ScraperInput } from '../interfaces/scraper-strategy.interface'

@Injectable()
export class TestScraperStrategy extends BaseScraperStrategy {
  constructor(eventEmitter: EventEmitter2) {
    super(eventEmitter)
  }
  private readonly logger = new Logger(TestScraperStrategy.name)
  private mainUrl = 'https://www.shell.com/motorist/find-the-right-oil.html'

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

    // Navigate to Shell main page
    this.logger.log('Navigating to Shell website...')
    await this.page.goto(this.mainUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    })

    // Handle cookie consent if present
    console.log('will it run? cookie')
    await this.closeCookieConsentIfPresent()

    console.log('will it run? disclaimer')
    // Handle disclaimer if present
    await this.closeDisclaimerIfPresent()

    // Select Cars category
    await this.selectCategory()
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close()
    }
    if (this.context) {
      await this.context.close()
    }
  }

  async *scrape(
    jobId: string,
    input: ScraperInput,
    onProgress: (processed: number, total: number) => void,
    _checkpoint?: any,
  ) {
    this.logger.log('Starting test scraping...')

    // Keep browser open for testing - wait for manual intervention
    this.logger.log('Browser will stay open for 30 seconds for testing...')
    this.logger.log('You can now test the button functionality manually')

    // Wait for 30 seconds to allow manual testing
    await this.page.waitForTimeout(30000)

    this.logger.log('Test scraping completed')

    // Yield a dummy item to satisfy the generator
    yield {
      provider: ScrapingProvider.SHELL,
      deduplicationKey: 'test-item',
      data: {
        category: 'Test',
        searchTerm: 'Test',
        vehicle: {
          brand: 'Test',
          model: 'Test',
          description: 'Test item for manual testing',
          years: '2024',
          fullName: 'Test Vehicle',
        },
        recommendation: {
          category: 'Test Category',
          products: [
            {
              type: 'Test',
              name: 'Test Product',
            },
          ],
        },
      },
      rawHtml: await this.page.content(),
      metadata: {
        url: this.page.url(),
        timestamp: new Date(),
        searchTerm: 'Test',
      },
    }
  }

  private async closeDisclaimerIfPresent() {
    const selector = 'button:has-text("Continue")'
    const button = await this.page.waitForSelector(selector, { timeout: 5000 })
    if (button) {
      await button.click()
    }

    await this.page.waitForTimeout(1000)
  }

  private async closeCookieConsentIfPresent() {
    const selector = 'button:has-text("Accept optional cookies")'
    const button = await this.page.waitForSelector(selector, { timeout: 5000 })
    if (button) {
      await button.click()
    }
    await this.page.waitForTimeout(1000)
  }

  private async selectCategory(): Promise<void> {
    this.logger.log('Selecting Cars category...')

    try {
      // Wait for the Cars option to be available
      const selector = 'li[role="option"] a.option-3DQsuX8:has-text("Cars")'
      const carsOption = await this.page.waitForSelector(selector, { timeout: 5000 })

      if (carsOption) {
        await carsOption.click()
        this.logger.log('Cars category selected successfully')

        // Wait a bit for the selection to take effect
        await this.page.waitForTimeout(1000)
      } else {
        this.logger.warn('Cars option not found')
      }
    } catch (error) {
      this.logger.warn(`Failed to select Cars category: ${error.message}`)
    }
  }
}
