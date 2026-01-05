import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { mockInterviewSessions, mockInterviewMetrics, interviewQuestions } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { parseRequestBody } from "@/lib/utils/api-validation"
import { requireAuth } from "@/lib/auth/middleware"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const sessionPostSchema = z.object({
  jobApplicationId: z.coerce.number().int().positive("jobApplicationId is required"),
  resumeAnalysisId: z.coerce.number().int().positive().optional(),
  feedbackMode: z.enum(["immediate", "summary"]).default("immediate"),
  questionCount: z.coerce.number().int().positive().max(50).default(10),
  selectedCategories: z.array(z.string()).optional(),
  difficulty: z.enum(["mixed", "easy", "medium", "hard"]).default("mixed"),
  voiceEnabled: z.boolean().default(false),
})

// GET /api/mock-interview/sessions - List sessions for a job application
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const jobApplicationId = searchParams.get("jobApplicationId")

    if (!jobApplicationId) {
      return NextResponse.json(
        { error: "jobApplicationId is required" },
        { status: 400 }
      )
    }

    const jobId = parseInt(jobApplicationId, 10)
    if (isNaN(jobId) || jobId <= 0) {
      return NextResponse.json(
        { error: "jobApplicationId must be a positive integer" },
        { status: 400 }
      )
    }

    const sessions = await db.query.mockInterviewSessions.findMany({
      where: eq(mockInterviewSessions.jobApplicationId, jobId),
      with: {
        resumeAnalysis: true,
      },
      orderBy: [desc(mockInterviewSessions.createdAt)],
    })

    // Get metrics for the job application
    const metrics = await db.query.mockInterviewMetrics.findFirst({
      where: eq(mockInterviewMetrics.jobApplicationId, jobId),
    })

    return NextResponse.json({ sessions, metrics })
  } catch (error) {
    console.error("Error fetching mock interview sessions:", error)
    return NextResponse.json(
      { error: "Failed to fetch mock interview sessions" },
      { status: 500 }
    )
  }
}

// POST /api/mock-interview/sessions - Create a new mock interview session
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const parsed = await parseRequestBody(request, sessionPostSchema)
    if (!parsed.success) return parsed.response

    const {
      jobApplicationId,
      resumeAnalysisId,
      feedbackMode,
      questionCount,
      selectedCategories,
      difficulty,
      voiceEnabled,
    } = parsed.data

    // Get available questions from resume analysis if resumeAnalysisId provided
    let availableQuestionCount = 0
    if (resumeAnalysisId) {
      const questions = await db.query.interviewQuestions.findMany({
        where: eq(interviewQuestions.resumeAnalysisId, resumeAnalysisId),
      })
      availableQuestionCount = questions.length
    }

    // Create the session
    const [session] = await db
      .insert(mockInterviewSessions)
      .values({
        jobApplicationId,
        resumeAnalysisId,
        feedbackMode,
        questionCount: Math.min(questionCount ?? 10, availableQuestionCount || (questionCount ?? 10)),
        selectedCategoriesJson: selectedCategories ? JSON.stringify(selectedCategories) : null,
        difficulty,
        voiceEnabled,
        status: "setup",
        currentQuestionIndex: 0,
      })
      .returning()

    // Ensure metrics record exists for this job application
    const existingMetrics = await db.query.mockInterviewMetrics.findFirst({
      where: eq(mockInterviewMetrics.jobApplicationId, jobApplicationId),
    })

    if (!existingMetrics) {
      await db.insert(mockInterviewMetrics).values({
        jobApplicationId,
        totalSessions: 1,
        completedSessions: 0,
      })
    } else {
      await db
        .update(mockInterviewMetrics)
        .set({
          totalSessions: (existingMetrics.totalSessions || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(mockInterviewMetrics.jobApplicationId, jobApplicationId))
    }

    // Fetch the full session with relations
    const fullSession = await db.query.mockInterviewSessions.findFirst({
      where: eq(mockInterviewSessions.id, session.id),
      with: {
        resumeAnalysis: true,
      },
    })

    return NextResponse.json({ session: fullSession }, { status: 201 })
  } catch (error) {
    console.error("Error creating mock interview session:", error)
    return NextResponse.json(
      { error: "Failed to create mock interview session" },
      { status: 500 }
    )
  }
}
