import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { jobApplications, coverLetters, resumeAnalyses } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { generateCoverLetter, compileCoverLetter } from "@/lib/ai/agents/cover-letter-generator"
import { safeJsonParse } from "@/lib/utils/safe-json"
import { parseRequestBody } from "@/lib/utils/api-validation"
import { requireAuth } from "@/lib/auth/middleware"
import { logger } from "@/lib/utils/logger"
import { logActivity } from "@/lib/activity/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Increase timeout for AI cover letter generation (5 minutes)
export const maxDuration = 300

const generateSchema = z.object({
  jobApplicationId: z.coerce.number().int().positive(),
  tone: z.enum(["formal", "conversational", "enthusiastic"]).default("formal"),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  useAnalysisInsights: z.boolean().default(true),
})

// POST - Generate a new cover letter
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const parsed = await parseRequestBody(request, generateSchema)
    if (!parsed.success) return parsed.response

    const { jobApplicationId, useAnalysisInsights } = parsed.data
    const tone = parsed.data.tone ?? "formal"
    const length = parsed.data.length ?? "medium"

    // Fetch job with resume and company
    const job = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.id, jobApplicationId),
      with: {
        resume: true,
        company: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (!job.resume) {
      return NextResponse.json(
        { error: "No resume attached to this job application" },
        { status: 400 }
      )
    }

    // Optionally fetch analysis insights
    let strengths: Array<{ area: string; description: string }> = []
    let skillGaps: Array<{ skill: string; recommendation: string }> = []

    if (useAnalysisInsights) {
      const analysis = await db.query.resumeAnalyses.findFirst({
        where: eq(resumeAnalyses.jobApplicationId, jobApplicationId),
        orderBy: [desc(resumeAnalyses.createdAt)],
      })

      if (analysis) {
        strengths = safeJsonParse(analysis.strengthsJson, [])
        skillGaps = safeJsonParse(analysis.skillGapsJson, [])
      }
    }

    // Determine next version number
    const existingLetters = await db.query.coverLetters.findMany({
      where: eq(coverLetters.jobApplicationId, jobApplicationId),
    })
    const nextVersion = existingLetters.length + 1

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const output = await generateCoverLetter({
            resumeContent: job.resume!.parsedContent,
            jobDescription: job.jobDescriptionText,
            companyName: job.company?.name || "the company",
            jobTitle: job.title,
            tone,
            length,
            strengths: useAnalysisInsights ? strengths : undefined,
            skillGaps: useAnalysisInsights ? skillGaps : undefined,
            onProgress: (progress) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "progress", ...progress })}\n\n`)
              )
            },
          })

          const fullContent = compileCoverLetter(output)

          // Save to database
          const [savedLetter] = await db
            .insert(coverLetters)
            .values({
              jobApplicationId,
              tone,
              length,
              useAnalysisInsights,
              greeting: output.greeting,
              openingParagraph: output.openingParagraph,
              bodyParagraphs: JSON.stringify(output.bodyParagraphs),
              closingParagraph: output.closingParagraph,
              signOff: output.signOff,
              fullContent,
              versionNumber: nextVersion,
              rawResponseJson: JSON.stringify(output),
            })
            .returning()

          logger.info("Cover letter generated", {
            coverLetterId: savedLetter.id,
            jobApplicationId,
            tone,
            length,
            version: nextVersion,
          })

          // Log activity
          await logActivity({
            jobApplicationId,
            activityType: "cover_letter_generated",
            title: `Cover letter created for "${job.title}"`,
            description: `Tone: ${tone} • Version ${nextVersion}`,
            metadata: {
              coverLetterId: savedLetter.id,
              tone,
              length,
              version: nextVersion,
              usedAnalysisInsights: useAnalysisInsights,
            },
          })

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                coverLetterId: savedLetter.id,
                coverLetter: {
                  ...savedLetter,
                  bodyParagraphs: output.bodyParagraphs,
                },
              })}\n\n`
            )
          )
          controller.close()
        } catch (error) {
          logger.error("Cover letter generation failed", {
            error: error instanceof Error ? error.message : String(error),
            jobApplicationId,
          })

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : "Generation failed",
              })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    logger.error("Cover letter route error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: "Failed to generate cover letter" },
      { status: 500 }
    )
  }
}

// GET - Fetch all cover letters for a job
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const jobApplicationId = searchParams.get("jobApplicationId")

    if (!jobApplicationId) {
      return NextResponse.json(
        { error: "jobApplicationId is required" },
        { status: 400 }
      )
    }

    const letters = await db.query.coverLetters.findMany({
      where: eq(coverLetters.jobApplicationId, parseInt(jobApplicationId, 10)),
      orderBy: [desc(coverLetters.createdAt)],
    })

    // Parse JSON fields
    const parsedLetters = letters.map((letter) => ({
      ...letter,
      bodyParagraphs: safeJsonParse(letter.bodyParagraphs, []),
    }))

    return NextResponse.json({ coverLetters: parsedLetters })
  } catch (error) {
    logger.error("Fetch cover letters error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: "Failed to fetch cover letters" },
      { status: 500 }
    )
  }
}
