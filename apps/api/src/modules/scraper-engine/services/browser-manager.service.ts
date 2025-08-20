import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { chromium, Browser, LaunchOptions } from 'playwright'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class BrowserManagerService implements OnModuleDestroy {
  private browsers: Map<string, Browser> = new Map()

  constructor(private configService: ConfigService) {}

  async launchBrowser(jobId: string): Promise<Browser> {
    // Check if browser already exists for this job
    const existingBrowser = this.browsers.get(jobId)
    if (existingBrowser && existingBrowser.isConnected()) {
      return existingBrowser
    }

    // Launch new browser with production-ready settings
    const launchOptions: LaunchOptions = {
      headless: this.configService.get('HEADLESS_BROWSER', 'false') === 'true',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--no-first-run',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
      timeout: this.configService.get('BROWSER_TIMEOUT', 60000),
    }

    // Add debugging options in development
    const enableDevtools = this.configService.get('BROWSER_DEVTOOLS', 'true') === 'true'
    const slowMoMs = Number(this.configService.get('BROWSER_SLOWMO_MS', 0))
    if (enableDevtools) {
      launchOptions.devtools = true
    }
    if (!Number.isNaN(slowMoMs) && slowMoMs > 0) {
      launchOptions.slowMo = slowMoMs
    }

    // Optionally use installed Chrome for better parity
    if (this.configService.get('BROWSER_CHANNEL', '') === 'chrome') {
      ;(launchOptions as any).channel = 'chrome'
    }

    try {
      const browser = await chromium.launch(launchOptions)

      // Set up error handlers
      browser.on('disconnected', () => {
        console.log(`Browser for job ${jobId} disconnected`)
        this.browsers.delete(jobId)
      })

      this.browsers.set(jobId, browser)
      console.log(`Browser launched for job ${jobId}`)

      return browser
    } catch (error) {
      console.error(`Failed to launch browser for job ${jobId}:`, error)
      throw new Error(`Browser launch failed: ${error.message}`)
    }
  }

  async closeBrowser(jobId: string): Promise<void> {
    const browser = this.browsers.get(jobId)
    if (browser) {
      try {
        if (browser.isConnected()) {
          await browser.close()
        }
        this.browsers.delete(jobId)
        console.log(`Browser closed for job ${jobId}`)
      } catch (error) {
        console.error(`Error closing browser for job ${jobId}:`, error)
        // Still remove from map even if close fails
        this.browsers.delete(jobId)
      }
    }
  }

  async getBrowser(jobId: string): Promise<Browser | null> {
    const browser = this.browsers.get(jobId)
    return browser && browser.isConnected() ? browser : null
  }

  async restartBrowser(jobId: string): Promise<Browser> {
    await this.closeBrowser(jobId)
    return this.launchBrowser(jobId)
  }

  getActiveBrowserCount(): number {
    let activeCount = 0
    for (const [jobId, browser] of this.browsers) {
      if (browser.isConnected()) {
        activeCount++
      } else {
        // Clean up disconnected browsers
        this.browsers.delete(jobId)
      }
    }
    return activeCount
  }

  async closeAllBrowsers(): Promise<void> {
    const closePromises = Array.from(this.browsers.entries()).map(async ([jobId, browser]) => {
      try {
        if (browser.isConnected()) {
          await browser.close()
        }
      } catch (error) {
        console.error(`Error closing browser for job ${jobId}:`, error)
      }
    })

    await Promise.allSettled(closePromises)
    this.browsers.clear()
    console.log('All browsers closed')
  }

  async onModuleDestroy() {
    console.log('Shutting down BrowserManager, closing all browsers...')
    await this.closeAllBrowsers()
  }

  // Health check method
  async healthCheck(): Promise<{
    active: number
    total: number
    details: Array<{ jobId: string; connected: boolean; contexts: number }>
  }> {
    const details: Array<{ jobId: string; connected: boolean; contexts: number }> = []
    let activeCount = 0

    for (const [jobId, browser] of this.browsers) {
      const isConnected = browser.isConnected()
      if (isConnected) {
        activeCount++
      }

      details.push({
        jobId,
        connected: isConnected,
        contexts: browser.contexts().length,
      })
    }

    return {
      active: activeCount,
      total: this.browsers.size,
      details,
    }
  }
}
