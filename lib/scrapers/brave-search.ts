import type { SearchResult } from "./search-client"

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY

interface BraveWebResult {
  title: string
  url: string
  description: string
}

interface BraveSearchResponse {
  web?: {
    results: BraveWebResult[]
  }
}

export function isBraveConfigured(): boolean {
  return !!BRAVE_API_KEY
}

export async function searchBrave(
  query: string,
  maxResults: number = 10
): Promise<SearchResult[]> {
  if (!BRAVE_API_KEY) {
    throw new Error("Brave Search API key not configured")
  }

  const url = new URL("https://api.search.brave.com/res/v1/web/search")
  url.searchParams.set("q", query)
  url.searchParams.set("count", String(maxResults))

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": BRAVE_API_KEY,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Brave Search API error: ${response.status} - ${errorText}`)
  }

  const data: BraveSearchResponse = await response.json()

  if (!data.web?.results) {
    return []
  }

  return data.web.results.slice(0, maxResults).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.description,
  }))
}
