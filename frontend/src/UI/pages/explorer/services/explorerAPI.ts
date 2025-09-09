// Base Explorer API Client - Imports are used in subclasses

// Rate limiter implementation
class RateLimiter {
  private queue: Array<() => void> = []
  private processing = false
  private lastRequestTime = 0
  private requestsPerSecond: number

  constructor(requestsPerSecond: number) {
    this.requestsPerSecond = requestsPerSecond
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return
    this.processing = true

    while (this.queue.length > 0) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      const minDelay = 1000 / this.requestsPerSecond

      if (timeSinceLastRequest < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - timeSinceLastRequest))
      }

      const task = this.queue.shift()
      if (task) {
        this.lastRequestTime = Date.now()
        await task()
      }
    }

    this.processing = false
  }
}

// Base Explorer API Client
export abstract class BaseExplorerAPI {
  protected apiUrl: string
  protected apiKey: string
  protected rateLimiter: RateLimiter
  protected maxRetries: number
  protected retryDelay: number

  constructor(config: {
    apiUrl: string
    apiKey: string
    requestsPerSecond: number
    maxRetries: number
    retryDelay: number
  }) {
    this.apiUrl = config.apiUrl
    this.apiKey = config.apiKey
    this.rateLimiter = new RateLimiter(config.requestsPerSecond)
    this.maxRetries = config.maxRetries
    this.retryDelay = config.retryDelay
  }

  protected async fetchWithRetry(url: string, retries = 0): Promise<any> {
    try {
      const response = await this.rateLimiter.execute(() =>
        fetch(url, {
          headers: {
            Accept: 'application/json',
          },
        }),
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Check for API-specific error responses
      if (data.status === '0' && data.message !== 'No transactions found') {
        throw new Error(data.message || 'API request failed')
      }

      return data
    } catch (error) {
      if (retries < this.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * (retries + 1)))
        return this.fetchWithRetry(url, retries + 1)
      }
      throw error
    }
  }

  protected buildUrl(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    if (this.apiKey) {
      searchParams.append('apikey', this.apiKey)
    }
    return `${this.apiUrl}?${searchParams.toString()}`
  }

  abstract fetchTransactions(params: any): Promise<any>
  abstract fetchTokenTransfers(params: any): Promise<any>
  abstract fetchInternalTransactions(params: any): Promise<any>
  abstract fetchLogs(params: any): Promise<any>
}
