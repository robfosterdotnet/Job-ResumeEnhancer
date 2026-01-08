import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { webSearch } from "@/lib/scrapers/search-client"
import { parseJobSearchResults } from "@/lib/scrapers/job-search-parser"
import { requireAuth } from "@/lib/auth/middleware"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required"),
  limit: z.coerce.number().min(1).max(20).optional().default(10),
})

// GET /api/job-search?q=<query>&limit=10 - Search for job listings
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")
    const limit = searchParams.get("limit")

    const parsed = searchQuerySchema.safeParse({ q: query, limit })
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { q, limit: maxResults } = parsed.data

    // Add "jobs" to the query if not already present to improve relevance
    const searchQuery = q.toLowerCase().includes("job")
      ? q
      : `${q} jobs`

    // Search using Brave (with DuckDuckGo fallback)
    const searchResults = await webSearch(searchQuery, { maxResults: maxResults + 5 })

    // Parse results to extract job metadata
    const parsedResults = parseJobSearchResults(searchResults)

    // Limit to requested number after filtering
    const limitedResults = parsedResults.slice(0, maxResults)

    return NextResponse.json({
      results: limitedResults,
      query: q,
      totalFound: limitedResults.length,
    })
  } catch (error) {
    console.error("Error searching jobs:", error)
    return NextResponse.json(
      { error: "Failed to search for jobs" },
      { status: 500 }
    )
  }
}
