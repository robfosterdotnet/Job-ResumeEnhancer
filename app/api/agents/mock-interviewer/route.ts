import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  mockInterviewSessions,
  mockInterviewResponses,
  mockInterviewMetrics,
} from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import {
  evaluateAnswer,
  generateFollowUp,
  generateSessionSummary,
  selectNextQuestion,
  type InterviewQuestion,
  type InterviewContext,
  type ResponseRecord,
} from "@/lib/ai/agents/mock-interviewer"
import { requireAuth } from "@/lib/auth/middleware"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Increase timeout for AI interview evaluation (5 minutes)
export const maxDuration = 300

type ActionType = "start" | "answer" | "skip" | "end"

interface RequestBody {
  sessionId: number
  action: ActionType
  userAnswer?: string
}

// POST /api/agents/mock-interviewer - Main interview agent (streaming)
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const body: RequestBody = await request.json()
    const { sessionId, action, userAnswer } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      )
    }

    if (!["start", "answer", "skip", "end"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'start', 'answer', 'skip', or 'end'" },
        { status: 400 }
      )
    }

    // Get session with related data
    const session = await db.query.mockInterviewSessions.findFirst({
      where: eq(mockInterviewSessions.id, sessionId),
      with: {
        resumeAnalysis: {
          with: {
            interviewQuestions: true,
          },
        },
        responses: {
          orderBy: (responses, { asc }) => [asc(responses.orderIndex)],
        },
        jobApplication: {
          with: {
            company: true,
            resume: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Build interview context
    const context: InterviewContext = {
      jobDescription: session.jobApplication?.jobDescriptionText || "",
      resumeContent: session.jobApplication?.resume?.parsedContent || "",
      companyName: session.jobApplication?.company?.name,
      jobTitle: session.jobApplication?.title,
    }

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const sendEvent = (event: Record<string, unknown>) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            )
          }

          switch (action) {
            case "start":
              await handleStart(session, context, sendEvent)
              break

            case "answer":
              if (!userAnswer) {
                sendEvent({ type: "error", error: "userAnswer is required" })
                break
              }
              await handleAnswer(session, userAnswer, context, sendEvent)
              break

            case "skip":
              await handleSkip(session, context, sendEvent)
              break

            case "end":
              await handleEnd(session, context, sendEvent)
              break
          }

          sendEvent({ type: "done" })
          controller.close()
        } catch (error) {
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
    console.error("Error in mock interviewer:", error)
    return NextResponse.json(
      { error: "Failed to process interview request" },
      { status: 500 }
    )
  }
}

type SessionWithRelations = NonNullable<
  Awaited<ReturnType<typeof db.query.mockInterviewSessions.findFirst>>
> & {
  resumeAnalysis?: {
    interviewQuestions: Array<{
      id: number
      question: string
      category: string | null
      difficulty: string | null
      suggestedAnswer: string | null
    }>
  } | null
  responses: Array<{
    id: number
    questionId: number | null
    questionText: string
    questionCategory: string | null
    questionDifficulty: string | null
    isFollowUp: boolean | null
    parentResponseId: number | null
    orderIndex: number
    userAnswer: string | null
    score: number | null
    feedback: string | null
  }>
  jobApplication?: {
    title: string
    jobDescriptionText: string | null
    company?: { name: string } | null
    resume?: { parsedContent: string | null } | null
  } | null
}

type SendEventFn = (event: Record<string, unknown>) => void

async function handleStart(
  session: SessionWithRelations,
  context: InterviewContext,
  sendEvent: SendEventFn
) {
  // Update session status
  await db
    .update(mockInterviewSessions)
    .set({
      status: "in_progress",
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(mockInterviewSessions.id, session.id))

  sendEvent({
    type: "status",
    status: "in_progress",
    message: "Interview started",
  })

  // Get available questions (filter out questions with null category/difficulty)
  const availableQuestions: InterviewQuestion[] =
    session.resumeAnalysis?.interviewQuestions
      .filter((q) => q.category !== null && q.difficulty !== null)
      .map((q) => ({
        id: q.id,
        question: q.question,
        category: (q.category || "behavioral") as InterviewQuestion["category"],
        difficulty: (q.difficulty || "medium") as InterviewQuestion["difficulty"],
        suggestedAnswer: q.suggestedAnswer || undefined,
      })) || []

  if (availableQuestions.length === 0) {
    sendEvent({
      type: "error",
      error: "No interview questions available. Please run resume analysis first.",
    })
    return
  }

  // Parse selected categories
  let selectedCategories: string[] | null = null
  if (session.selectedCategoriesJson) {
    try {
      selectedCategories = JSON.parse(session.selectedCategoriesJson)
    } catch {
      selectedCategories = null
    }
  }

  // Select first question
  const answeredIds = new Set(
    session.responses.filter((r) => r.questionId).map((r) => r.questionId!)
  )
  const categoryPerformance = new Map<string, { total: number; count: number }>()

  const nextQuestion = selectNextQuestion(
    availableQuestions,
    answeredIds,
    categoryPerformance,
    {
      selectedCategories,
      difficulty: (session.difficulty as "mixed" | "easy" | "medium" | "hard") || "mixed",
    }
  )

  if (!nextQuestion) {
    sendEvent({ type: "error", error: "No suitable questions found" })
    return
  }

  // Create response record
  await db.insert(mockInterviewResponses).values({
    sessionId: session.id,
    questionId: nextQuestion.id,
    questionText: nextQuestion.question,
    questionCategory: nextQuestion.category,
    questionDifficulty: nextQuestion.difficulty,
    isFollowUp: false,
    orderIndex: 0,
  })

  // Update current question index
  await db
    .update(mockInterviewSessions)
    .set({
      currentQuestionIndex: 0,
      updatedAt: new Date(),
    })
    .where(eq(mockInterviewSessions.id, session.id))

  sendEvent({
    type: "question",
    questionNumber: 1,
    totalQuestions: session.questionCount,
    questionText: nextQuestion.question,
    category: nextQuestion.category,
    difficulty: nextQuestion.difficulty,
  })
}

async function handleAnswer(
  session: SessionWithRelations,
  userAnswer: string,
  context: InterviewContext,
  sendEvent: SendEventFn
) {
  // Get current question (latest unanswered response)
  const currentResponse = session.responses.find((r) => !r.userAnswer)

  if (!currentResponse) {
    sendEvent({ type: "error", error: "No pending question to answer" })
    return
  }

  sendEvent({ type: "status", status: "evaluating", message: "Evaluating your answer..." })

  // Build question object
  const question: InterviewQuestion = {
    id: currentResponse.questionId || undefined,
    question: currentResponse.questionText,
    category: (currentResponse.questionCategory || "behavioral") as InterviewQuestion["category"],
    difficulty: (currentResponse.questionDifficulty || "medium") as InterviewQuestion["difficulty"],
  }

  // Evaluate answer
  const evaluation = await evaluateAnswer(question, userAnswer, context)

  // Update response with answer and evaluation
  const answeredAt = new Date()
  await db
    .update(mockInterviewResponses)
    .set({
      userAnswer,
      answeredAt,
      score: evaluation.score,
      feedback: evaluation.feedback,
      suggestedImprovement: evaluation.suggestedImprovement,
      keyPointsCoveredJson: JSON.stringify(evaluation.keyPointsCovered),
      keyPointsMissedJson: JSON.stringify(evaluation.keyPointsMissed),
      evaluatedAt: new Date(),
    })
    .where(eq(mockInterviewResponses.id, currentResponse.id))

  // Send feedback if immediate mode
  if (session.feedbackMode === "immediate") {
    sendEvent({
      type: "feedback",
      score: evaluation.score,
      feedback: evaluation.feedback,
      suggestedImprovement: evaluation.suggestedImprovement,
      keyPointsCovered: evaluation.keyPointsCovered,
      keyPointsMissed: evaluation.keyPointsMissed,
      starAnalysis: evaluation.starAnalysis,
    })
  } else {
    sendEvent({
      type: "answer_recorded",
      message: "Your answer has been recorded",
    })
  }

  // Check for follow-up question
  const currentFollowUpCount = session.responses.filter(
    (r) => r.isFollowUp && r.parentResponseId === currentResponse.id
  ).length

  const followUpDecision = await generateFollowUp(
    question,
    userAnswer,
    evaluation,
    currentFollowUpCount
  )

  const answeredCount = session.responses.filter((r) => r.userAnswer).length + 1
  const targetCount = session.questionCount || 10

  if (followUpDecision.shouldFollowUp && followUpDecision.followUpQuestion) {
    // Create follow-up response record
    const newOrderIndex = (session.currentQuestionIndex || 0) + 1
    await db.insert(mockInterviewResponses).values({
      sessionId: session.id,
      questionId: null, // AI-generated
      questionText: followUpDecision.followUpQuestion,
      questionCategory: "follow-up",
      questionDifficulty: (currentResponse.questionDifficulty as "easy" | "medium" | "hard" | null) || "medium",
      isFollowUp: true,
      parentResponseId: currentResponse.id,
      orderIndex: newOrderIndex,
    })

    await db
      .update(mockInterviewSessions)
      .set({
        currentQuestionIndex: newOrderIndex,
        updatedAt: new Date(),
      })
      .where(eq(mockInterviewSessions.id, session.id))

    sendEvent({
      type: "follow_up",
      questionText: followUpDecision.followUpQuestion,
      reason: followUpDecision.reason,
      questionNumber: answeredCount + 1,
      totalQuestions: targetCount,
    })
  } else if (answeredCount < targetCount) {
    // Move to next question
    await sendNextQuestion(session, context, answeredCount, sendEvent)
  } else {
    // All questions answered
    sendEvent({
      type: "interview_complete",
      message: "All questions have been answered",
      answeredCount,
    })
  }
}

async function handleSkip(
  session: SessionWithRelations,
  context: InterviewContext,
  sendEvent: SendEventFn
) {
  // Get current question
  const currentResponse = session.responses.find((r) => !r.userAnswer)

  if (!currentResponse) {
    sendEvent({ type: "error", error: "No pending question to skip" })
    return
  }

  // Mark as skipped with score 0
  await db
    .update(mockInterviewResponses)
    .set({
      userAnswer: "[SKIPPED]",
      answeredAt: new Date(),
      score: 0,
      feedback: "Question was skipped",
    })
    .where(eq(mockInterviewResponses.id, currentResponse.id))

  sendEvent({ type: "question_skipped", message: "Question skipped" })

  const answeredCount = session.responses.filter((r) => r.userAnswer).length + 1
  const targetCount = session.questionCount || 10

  if (answeredCount < targetCount) {
    await sendNextQuestion(session, context, answeredCount, sendEvent)
  } else {
    sendEvent({
      type: "interview_complete",
      message: "All questions have been answered",
      answeredCount,
    })
  }
}

async function handleEnd(
  session: SessionWithRelations,
  context: InterviewContext,
  sendEvent: SendEventFn
) {
  sendEvent({ type: "status", status: "generating_summary", message: "Generating summary..." })

  // Get all responses for this session
  const responses = await db.query.mockInterviewResponses.findMany({
    where: eq(mockInterviewResponses.sessionId, session.id),
    orderBy: [asc(mockInterviewResponses.orderIndex)],
  })

  // Filter to answered questions only
  const answeredResponses: ResponseRecord[] = responses
    .filter((r) => r.userAnswer && r.userAnswer !== "[SKIPPED]" && r.score !== null)
    .map((r) => ({
      questionText: r.questionText,
      questionCategory: r.questionCategory || "behavioral",
      userAnswer: r.userAnswer!,
      score: r.score!,
      feedback: r.feedback || "",
    }))

  if (answeredResponses.length === 0) {
    // No answers to summarize
    await db
      .update(mockInterviewSessions)
      .set({
        status: "completed",
        completedAt: new Date(),
        overallScore: 0,
        summaryFeedback: "No questions were answered in this session.",
        updatedAt: new Date(),
      })
      .where(eq(mockInterviewSessions.id, session.id))

    sendEvent({
      type: "summary",
      overallScore: 0,
      summaryFeedback: "No questions were answered in this session.",
      strengthAreas: [],
      improvementAreas: [],
      categoryScores: {},
      recommendations: ["Try completing at least a few questions in your next practice session."],
    })

    sendEvent({
      type: "complete",
      sessionId: session.id,
      status: "completed",
    })
    return
  }

  // Generate summary
  const summary = await generateSessionSummary(answeredResponses, context)

  // Update session with summary
  await db
    .update(mockInterviewSessions)
    .set({
      status: "completed",
      completedAt: new Date(),
      overallScore: summary.overallScore,
      summaryFeedback: summary.summaryFeedback,
      strengthAreasJson: JSON.stringify(summary.strengthAreas),
      improvementAreasJson: JSON.stringify(summary.improvementAreas),
      updatedAt: new Date(),
    })
    .where(eq(mockInterviewSessions.id, session.id))

  // Update metrics
  await updateMetrics(session.jobApplicationId, summary.overallScore, summary.categoryScores)

  sendEvent({
    type: "summary",
    overallScore: summary.overallScore,
    summaryFeedback: summary.summaryFeedback,
    strengthAreas: summary.strengthAreas,
    improvementAreas: summary.improvementAreas,
    categoryScores: summary.categoryScores,
    recommendations: summary.recommendations,
  })

  sendEvent({
    type: "complete",
    sessionId: session.id,
    status: "completed",
  })
}

async function sendNextQuestion(
  session: SessionWithRelations,
  context: InterviewContext,
  answeredCount: number,
  sendEvent: SendEventFn
) {
  // Get available questions (filter out questions with null category/difficulty)
  const availableQuestions: InterviewQuestion[] =
    session.resumeAnalysis?.interviewQuestions
      .filter((q) => q.category !== null && q.difficulty !== null)
      .map((q) => ({
        id: q.id,
        question: q.question,
        category: (q.category || "behavioral") as InterviewQuestion["category"],
        difficulty: (q.difficulty || "medium") as InterviewQuestion["difficulty"],
        suggestedAnswer: q.suggestedAnswer || undefined,
      })) || []

  // Parse selected categories
  let selectedCategories: string[] | null = null
  if (session.selectedCategoriesJson) {
    try {
      selectedCategories = JSON.parse(session.selectedCategoriesJson)
    } catch {
      selectedCategories = null
    }
  }

  // Get answered question IDs
  const answeredIds = new Set(
    session.responses.filter((r) => r.questionId && r.userAnswer).map((r) => r.questionId!)
  )

  // Build category performance from existing responses
  const categoryPerformance = new Map<string, { total: number; count: number }>()
  for (const response of session.responses) {
    if (response.score !== null && response.questionCategory) {
      const cat = response.questionCategory
      const current = categoryPerformance.get(cat) || { total: 0, count: 0 }
      categoryPerformance.set(cat, {
        total: current.total + response.score,
        count: current.count + 1,
      })
    }
  }

  const nextQuestion = selectNextQuestion(
    availableQuestions,
    answeredIds,
    categoryPerformance,
    {
      selectedCategories,
      difficulty: (session.difficulty as "mixed" | "easy" | "medium" | "hard") || "mixed",
    }
  )

  if (!nextQuestion) {
    sendEvent({
      type: "interview_complete",
      message: "No more questions available",
      answeredCount,
    })
    return
  }

  // Create response record
  const newOrderIndex = answeredCount
  await db.insert(mockInterviewResponses).values({
    sessionId: session.id,
    questionId: nextQuestion.id,
    questionText: nextQuestion.question,
    questionCategory: nextQuestion.category,
    questionDifficulty: nextQuestion.difficulty,
    isFollowUp: false,
    orderIndex: newOrderIndex,
  })

  // Update current question index
  await db
    .update(mockInterviewSessions)
    .set({
      currentQuestionIndex: newOrderIndex,
      updatedAt: new Date(),
    })
    .where(eq(mockInterviewSessions.id, session.id))

  sendEvent({
    type: "question",
    questionNumber: answeredCount + 1,
    totalQuestions: session.questionCount,
    questionText: nextQuestion.question,
    category: nextQuestion.category,
    difficulty: nextQuestion.difficulty,
  })
}

async function updateMetrics(
  jobApplicationId: number,
  overallScore: number,
  categoryScores: Record<string, number | null>
) {
  const metrics = await db.query.mockInterviewMetrics.findFirst({
    where: eq(mockInterviewMetrics.jobApplicationId, jobApplicationId),
  })

  if (!metrics) return

  const completedSessions = (metrics.completedSessions || 0) + 1
  const currentAvg = metrics.averageScore || 0
  const newAvg =
    (currentAvg * (completedSessions - 1) + overallScore) / completedSessions

  // Update score history
  let scoreHistory: Array<{ date: string; score: number }> = []
  if (metrics.scoreHistoryJson) {
    try {
      scoreHistory = JSON.parse(metrics.scoreHistoryJson)
    } catch {
      scoreHistory = []
    }
  }
  scoreHistory.push({
    date: new Date().toISOString(),
    score: overallScore,
  })

  // Find strongest and weakest categories
  const validCategories = Object.entries(categoryScores).filter(
    ([, score]) => score !== null
  ) as [string, number][]

  let strongestCategory = metrics.strongestCategory
  let weakestCategory = metrics.weakestCategory

  if (validCategories.length > 0) {
    validCategories.sort((a, b) => b[1] - a[1])
    strongestCategory = validCategories[0][0]
    weakestCategory = validCategories[validCategories.length - 1][0]
  }

  await db
    .update(mockInterviewMetrics)
    .set({
      completedSessions,
      averageScore: newAvg,
      scoreHistoryJson: JSON.stringify(scoreHistory),
      behavioralAvgScore: categoryScores.behavioral ?? metrics.behavioralAvgScore,
      technicalAvgScore: categoryScores.technical ?? metrics.technicalAvgScore,
      situationalAvgScore: categoryScores.situational ?? metrics.situationalAvgScore,
      companySpecificAvgScore:
        categoryScores.companySpecific ?? metrics.companySpecificAvgScore,
      roleSpecificAvgScore:
        categoryScores.roleSpecific ?? metrics.roleSpecificAvgScore,
      strongestCategory,
      weakestCategory,
      updatedAt: new Date(),
    })
    .where(eq(mockInterviewMetrics.jobApplicationId, jobApplicationId))
}
