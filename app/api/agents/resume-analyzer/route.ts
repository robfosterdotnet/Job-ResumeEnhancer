import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jobApplications, resumeAnalyses, interviewQuestions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { runResumeAnalysis } from "@/lib/ai/agents/resume-analyzer"
import { requireAuth } from "@/lib/auth/middleware"
import { logActivity, updateAggregatedSkillGaps } from "@/lib/activity/logger"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Increase timeout for long-running AI analysis (5 minutes)
// Vercel Pro: up to 300s, Hobby: 10s max (will timeout on hobby plan)
export const maxDuration = 300

// POST /api/agents/resume-analyzer - Run resume analysis
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { jobApplicationId } = body

    if (!jobApplicationId) {
      return NextResponse.json(
        { error: "Job application ID is required" },
        { status: 400 }
      )
    }

    // Fetch job application with resume
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

    // Update status to analyzing
    await db
      .update(jobApplications)
      .set({ status: "analyzing", updatedAt: new Date() })
      .where(eq(jobApplications.id, jobApplicationId))

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const analysis = await runResumeAnalysis({
            resumeContent: job.resume!.parsedContent,
            jobDescription: job.jobDescriptionText,
            onProgress: (progress) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "progress", ...progress })}\n\n`)
              )
            },
          })

          // Save analysis to database
          const [savedAnalysis] = await db
            .insert(resumeAnalyses)
            .values({
              jobApplicationId,
              fitScore: analysis.fitScore,
              overallSummary: analysis.summary,
              strengthsJson: JSON.stringify(analysis.strengths),
              weaknessesJson: JSON.stringify(analysis.weaknesses),
              enhancementSuggestionsJson: JSON.stringify(analysis.enhancements),
              skillGapsJson: JSON.stringify(analysis.skillGaps),
              interviewQuestionsJson: JSON.stringify(analysis.interviewQuestions),
              keywordsMatchedJson: JSON.stringify(analysis.keywordsMatched),
              keywordsMissingJson: JSON.stringify(analysis.keywordsMissing),
              rawResponseJson: JSON.stringify(analysis),
            })
            .returning()

          // Save interview questions separately for easier querying
          if (analysis.interviewQuestions.length > 0) {
            await db.insert(interviewQuestions).values(
              analysis.interviewQuestions.map((q, index) => ({
                resumeAnalysisId: savedAnalysis.id,
                question: q.question,
                category: q.category,
                suggestedAnswer: q.suggestedAnswer,
                difficulty: q.difficulty,
                orderIndex: index,
              }))
            )
          }

          // Update job status to analyzed
          await db
            .update(jobApplications)
            .set({ status: "analyzed", updatedAt: new Date() })
            .where(eq(jobApplications.id, jobApplicationId))

          // Log activity
          await logActivity({
            jobApplicationId,
            activityType: "analysis_completed",
            title: `Resume analysis completed for "${job.title}"`,
            description: `Fit Score: ${analysis.fitScore}% • ${analysis.interviewQuestions.length} interview questions generated`,
            metadata: {
              analysisId: savedAnalysis.id,
              fitScore: analysis.fitScore,
              questionCount: analysis.interviewQuestions.length,
            },
          })

          // Update aggregated skill gaps
          if (analysis.skillGaps && analysis.skillGaps.length > 0) {
            await updateAggregatedSkillGaps(jobApplicationId, analysis.skillGaps)
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                analysisId: savedAnalysis.id,
                analysis,
              })}\n\n`
            )
          )
          controller.close()
        } catch (error) {
          // Revert status on error
          await db
            .update(jobApplications)
            .set({ status: "saved", updatedAt: new Date() })
            .where(eq(jobApplications.id, jobApplicationId))

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : "Unknown error",
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
    console.error("Error running resume analysis:", error)
    return NextResponse.json(
      { error: "Failed to run resume analysis" },
      { status: 500 }
    )
  }
}

// GET /api/agents/resume-analyzer?jobApplicationId=X - Get analysis results
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const jobApplicationId = searchParams.get("jobApplicationId")

    if (!jobApplicationId) {
      return NextResponse.json(
        { error: "Job application ID is required" },
        { status: 400 }
      )
    }

    const analyses = await db.query.resumeAnalyses.findMany({
      where: eq(resumeAnalyses.jobApplicationId, parseInt(jobApplicationId, 10)),
      with: {
        interviewQuestions: true,
      },
      orderBy: (analyses, { desc }) => [desc(analyses.createdAt)],
    })

    return NextResponse.json({ analyses })
  } catch (error) {
    console.error("Error fetching analyses:", error)
    return NextResponse.json(
      { error: "Failed to fetch analyses" },
      { status: 500 }
    )
  }
}
