import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { resumes } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { runQuickFitScore } from "@/lib/ai/agents/quick-fit-scorer"
import { parseRequestBody } from "@/lib/utils/api-validation"
import { requireAuth } from "@/lib/auth/middleware"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60 // 1 minute timeout for AI call

const quickFitRequestSchema = z.object({
  resumeId: z.number(),
  jobTitle: z.string().min(1),
  jobSnippet: z.string().min(1),
  jobUrl: z.string().url().optional(),
  deepFetch: z.boolean().optional().default(false),
})

// POST /api/job-search/quick-fit - Calculate quick fit score for a job
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const parsed = await parseRequestBody(request, quickFitRequestSchema)
    if (!parsed.success) return parsed.response

    const { resumeId, jobTitle, jobSnippet, deepFetch } = parsed.data

    // Fetch resume from database
    const resume = await db.query.resumes.findFirst({
      where: eq(resumes.id, resumeId),
    })

    if (!resume) {
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      )
    }

    if (!resume.parsedContent) {
      return NextResponse.json(
        { error: "Resume content not available" },
        { status: 400 }
      )
    }

    // For now, use the snippet. Deep fetch can be added later
    // TODO: If deepFetch is true, scrape the full job description from jobUrl
    let jobDescription: string | undefined
    if (deepFetch) {
      // Future enhancement: scrape full job description
      // jobDescription = await scrapeJobDescription(jobUrl)
    }

    // Run quick fit scoring
    const result = await runQuickFitScore({
      resumeContent: resume.parsedContent,
      jobTitle,
      jobSnippet,
      jobDescription,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error calculating quick fit:", error)
    return NextResponse.json(
      { error: "Failed to calculate fit score" },
      { status: 500 }
    )
  }
}
