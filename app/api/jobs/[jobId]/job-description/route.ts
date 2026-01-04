import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jobApplications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { scrapeJobUrl } from "@/lib/scrapers/job-scraper"

type RouteParams = { params: Promise<{ jobId: string }> }

// POST /api/jobs/[jobId]/job-description - Add job description (URL or text)
export async function POST(request: NextRequest, { params }: RouteParams) {
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
      // Scrape the URL
      try {
        const scraped = await scrapeJobUrl(url)
        jobDescriptionText = scraped.description
        jobDescriptionUrl = url
      } catch (error) {
        return NextResponse.json(
          { error: `Failed to scrape URL: ${error instanceof Error ? error.message : "Unknown error"}` },
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
    console.error("Error updating job description:", error)
    return NextResponse.json(
      { error: "Failed to update job description" },
      { status: 500 }
    )
  }
}
