import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { mockInterviewSessions, mockInterviewMetrics, interviewQuestions } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"

// GET /api/mock-interview/sessions - List sessions for a job application
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

    const sessions = await db.query.mockInterviewSessions.findMany({
      where: eq(mockInterviewSessions.jobApplicationId, parseInt(jobApplicationId, 10)),
      with: {
        resumeAnalysis: true,
      },
      orderBy: [desc(mockInterviewSessions.createdAt)],
    })

    // Get metrics for the job application
    const metrics = await db.query.mockInterviewMetrics.findFirst({
      where: eq(mockInterviewMetrics.jobApplicationId, parseInt(jobApplicationId, 10)),
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
  try {
    const body = await request.json()
    const {
      jobApplicationId,
      resumeAnalysisId,
      feedbackMode = "immediate",
      questionCount = 10,
      selectedCategories,
      difficulty = "mixed",
      voiceEnabled = false,
    } = body

    if (!jobApplicationId) {
      return NextResponse.json(
        { error: "jobApplicationId is required" },
        { status: 400 }
      )
    }

    // Validate feedbackMode
    if (!["immediate", "summary"].includes(feedbackMode)) {
      return NextResponse.json(
        { error: "feedbackMode must be 'immediate' or 'summary'" },
        { status: 400 }
      )
    }

    // Validate difficulty
    if (!["mixed", "easy", "medium", "hard"].includes(difficulty)) {
      return NextResponse.json(
        { error: "difficulty must be 'mixed', 'easy', 'medium', or 'hard'" },
        { status: 400 }
      )
    }

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
        questionCount: Math.min(questionCount, availableQuestionCount || questionCount),
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
