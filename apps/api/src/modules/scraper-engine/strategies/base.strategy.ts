import { Browser, Page, BrowserContext } from 'playwright'
import { ScrapingProvider } from '@prisma/client'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ScraperInput, ScrapedItem, ScraperStrategy } from '../interfaces/scraper-strategy.interface'

export abstract class BaseScraperStrategy implements ScraperStrategy {
  protected page: Page
  protected context: BrowserContext
  protected eventEmitter: EventEmitter2

  constructor(eventEmitter: EventEmitter2) {
    this.eventEmitter = eventEmitter
  }

  abstract getProvider(): ScrapingProvider

  abstract initialize(browser: Browser): Promise<void>

  abstract scrape(
    jobId: string,
    input: ScraperInput,
    onProgress: (processed: number, total: number) => void,
    checkpoint?: any,
  ): AsyncGenerator<ScrapedItem>

  abstract cleanup(): Promise<void>

  async saveBrowserState(): Promise<any> {
    if (!this.context || !this.page) {
      return null
    }

    try {
      // Save cookies, localStorage, current URL for checkpoints
      const cookies = await this.context.cookies()
      const url = this.page.url()

      // Try to get localStorage if possible
      let localStorage = {}
      try {
        localStorage = await this.page.evaluate(() => ({ ...window.localStorage }))
      } catch (error) {
        console.warn('Could not access localStorage:', error.message)
      }

      return {
        cookies,
        url,
        localStorage,
        timestamp: new Date(),
      }
    } catch (error) {
      console.error('Error saving browser state:', error)
      return null
    }
  }

  async restoreBrowserState(state: any): Promise<void> {
    if (!state || !this.context || !this.page) {
      return
    }

    try {
      // Restore cookies
      if (state.cookies && Array.isArray(state.cookies)) {
        await this.context.addCookies(state.cookies)
      }

      // Navigate to saved URL
      if (state.url && typeof state.url === 'string') {
        await this.page.goto(state.url, {
          waitUntil: 'networkidle',
          timeout: 30000,
        })
      }

      // Restore localStorage
      if (state.localStorage && typeof state.localStorage === 'object') {
        await this.page.evaluate(localStorageData => {
          Object.keys(localStorageData).forEach(key => {
            localStorage.setItem(key, localStorageData[key])
          })
        }, state.localStorage)
      }
    } catch (error) {
      console.error('Error restoring browser state:', error)
      // Don't throw - continue with fresh state
    }
  }

  protected emitItem(jobId: string, item: ScrapedItem): void {
    this.eventEmitter.emit('scraper.itemFound', {
      jobId,
      provider: this.getProvider(),
      item,
      sourceUrl: (item as any)?.metadata?.url,
      metadata: (item as any)?.metadata,
      timestamp: new Date(),
    })
  }

  protected emitError(jobId: string, error: Error): void {
    this.eventEmitter.emit('scraper.error', {
      jobId,
      error: error.message,
      stack: error.stack,
    })
  }

  protected emitProgress(jobId: string, processed: number, total: number): void {
    const percentage = total > 0 ? (processed / total) * 100 : 0
    this.eventEmitter.emit('job.progressUpdated', {
      jobId,
      percentage,
      itemsScraped: processed,
      timestamp: new Date(),
    })
  }

  protected async randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    await this.page?.waitForTimeout(delay)
  }

  protected async waitForElement(selector: string, timeout: number = 10000): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized')
    }

    await this.page.waitForSelector(selector, {
      state: 'visible',
      timeout,
    })
  }

  protected async safeClick(selector: string, timeout: number = 10000): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized')
    }

    await this.waitForElement(selector, timeout)
    await this.page.click(selector)
    await this.randomDelay(500, 1500) // Wait after click
  }

  protected async safeType(selector: string, text: string, timeout: number = 10000): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized')
    }

    await this.waitForElement(selector, timeout)
    await this.page.fill(selector, '') // Clear first
    await this.page.type(selector, text, { delay: 100 }) // Type like human
    await this.randomDelay(300, 800)
  }
}
