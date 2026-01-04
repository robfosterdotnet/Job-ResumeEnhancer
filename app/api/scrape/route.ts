import { NextRequest, NextResponse } from "next/server"
import { scrapeJobUrl } from "@/lib/scrapers/job-scraper"

// POST /api/scrape - Scrape a job description URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    const result = await scrapeJobUrl(url)

    return NextResponse.json({
      title: result.title,
      company: result.company,
      location: result.location,
      description: result.description,
    })
  } catch (error) {
    console.error("Error scraping URL:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to scrape URL" },
      { status: 500 }
    )
  }
}
