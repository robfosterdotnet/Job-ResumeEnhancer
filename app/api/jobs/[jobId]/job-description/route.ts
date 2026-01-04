import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jobApplications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { scrapeJobUrl } from "@/lib/scrapers/job-scraper"
import { logger } from "@/lib/utils/logger"
import { requireAuth } from "@/lib/auth/middleware"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteParams = { params: Promise<{ jobId: string }> }

// POST /api/jobs/[jobId]/job-description - Add job description (URL or text)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { jobId } = await params
    const id = parseInt(jobId, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 })
    }

    // Check if job exists
    const job = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.id, id),
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const body = await request.json()
    const { url, text } = body

    let jobDescriptionText: string
    let jobDescriptionUrl: string | undefined

    if (url) {
      // Scrape the URL (includes SSRF protection)
      try {
        const scraped = await scrapeJobUrl(url)
        jobDescriptionText = scraped.description
        jobDescriptionUrl = url
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        // Log SSRF attempts but don't expose full URL
        if (message.includes("URL blocked") || message.includes("not allowed")) {
          logger.warn("SSRF attempt blocked in job-description", { error: message })
        }
        return NextResponse.json(
          { error: `Failed to scrape URL: ${message}` },
          { status: 400 }
        )
      }
    } else if (text) {
      jobDescriptionText = text
    } else {
      return NextResponse.json(
        { error: "Either URL or text is required" },
        { status: 400 }
      )
    }

    // Update job application
    await db
      .update(jobApplications)
      .set({
        jobDescriptionText,
        jobDescriptionUrl,
        updatedAt: new Date(),
      })
      .where(eq(jobApplications.id, id))

    const updatedJob = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.id, id),
      with: {
        company: true,
        resume: true,
      },
    })

    return NextResponse.json({ job: updatedJob })
  } catch (error) {
    logger.error("Error updating job description", error)
    return NextResponse.json(
      { error: "Failed to update job description" },
      { status: 500 }
    )
  }
}
