import { NextRequest, NextResponse } from "next/server"
import { scrapeJobUrl } from "@/lib/scrapers/job-scraper"
import { logger } from "@/lib/utils/logger"
import { requireAuth } from "@/lib/auth/middleware"

// Scraper requires Node.js runtime for DNS resolution
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/scrape - Scrape a job description URL
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Basic URL format validation
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const result = await scrapeJobUrl(url)

    return NextResponse.json({
      title: result.title,
      company: result.company,
      location: result.location,
      description: result.description,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to scrape URL"

    // Return 400 for SSRF-blocked URLs
    if (message.includes("URL blocked") || message.includes("not allowed")) {
      logger.warn("SSRF attempt blocked", { url: "[redacted]", error: message })
      return NextResponse.json({ error: message }, { status: 400 })
    }

    logger.error("Error scraping URL", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
