import { search, SafeSearchType } from "duck-duck-scrape"
import { searchBrave, isBraveConfigured } from "./brave-search"
import { logger, sanitizeForLog } from "@/lib/utils/logger"

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface SearchOptions {
  maxResults?: number
  safeSearch?: "off" | "moderate" | "strict"
}

// Helper to add delay between requests
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | undefined
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const waitTime = baseDelay * Math.pow(2, attempt - 1)
        await delay(waitTime)
      }
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      logger.warn(`Search attempt ${attempt + 1} failed`, { error: lastError.message })
    }
  }
  throw lastError
}

// DuckDuckGo search (fallback)
async function searchDuckDuckGoInternal(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { maxResults = 10, safeSearch = "off" } = options

  const safeSearchMap: Record<string, SafeSearchType> = {
    off: SafeSearchType.OFF,
    moderate: SafeSearchType.MODERATE,
    strict: SafeSearchType.STRICT,
  }

  const results = await retryWithBackoff(async () => {
    return await search(query, {
      safeSearch: safeSearchMap[safeSearch],
    })
  })

  return results.results.slice(0, maxResults).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.description,
  }))
}

// Main search function - uses Brave if configured, falls back to DDG
export async function webSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { maxResults = 10 } = options

  // Try Brave Search first if configured
  if (isBraveConfigured()) {
    try {
      logger.debug("Using Brave Search", { query: sanitizeForLog(query, 100) })
      return await searchBrave(query, maxResults)
    } catch (error) {
      logger.warn("Brave Search failed, falling back to DuckDuckGo", { error: error instanceof Error ? error.message : String(error) })
    }
  }

  // Fall back to DuckDuckGo
  try {
    logger.debug("Using DuckDuckGo", { query: sanitizeForLog(query, 100) })
    return await searchDuckDuckGoInternal(query, options)
  } catch (error) {
    logger.error("DuckDuckGo search failed", error)
    return []
  }
}

// Legacy export for backwards compatibility
export const searchDuckDuckGo = webSearch

export async function searchCompany(companyName: string): Promise<{
  overview: SearchResult[]
  leadership: SearchResult[]
  news: SearchResult[]
  reviews: SearchResult[]
  legal: SearchResult[]
  culture: SearchResult[]
}> {
  // Brave allows 1 query/second - use 1.5s to be safe, DDG needs longer delays
  const searchDelay = isBraveConfigured() ? 1500 : 2000

  const overview = await webSearch(`${companyName} company overview about`, { maxResults: 5 })
  await delay(searchDelay)

  const leadership = await webSearch(`${companyName} leadership team CEO executives board directors`, { maxResults: 5 })
  await delay(searchDelay)

  const news = await webSearch(`${companyName} news latest 2025 2026`, { maxResults: 5 })
  await delay(searchDelay)

  const reviews = await webSearch(`${companyName} glassdoor reviews employee`, { maxResults: 5 })
  await delay(searchDelay)

  const legal = await webSearch(`${companyName} lawsuit legal issues litigation`, { maxResults: 5 })
  await delay(searchDelay)

  const culture = await webSearch(`${companyName} company culture values work environment`, { maxResults: 5 })

  return { overview, leadership, news, reviews, legal, culture }
}
