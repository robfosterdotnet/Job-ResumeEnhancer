import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { mockInterviewSessions, mockInterviewResponses, mockInterviewMetrics } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

// GET /api/mock-interview/sessions/[sessionId] - Get a specific session
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { sessionId } = await params
    const id = parseInt(sessionId, 10)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 }
      )
    }

    const session = await db.query.mockInterviewSessions.findFirst({
      where: eq(mockInterviewSessions.id, id),
      with: {
        resumeAnalysis: {
          with: {
            interviewQuestions: true,
          },
        },
        responses: {
          orderBy: (responses, { asc }) => [asc(responses.orderIndex)],
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Error fetching mock interview session:", error)
    return NextResponse.json(
      { error: "Failed to fetch mock interview session" },
      { status: 500 }
    )
  }
}

// PATCH /api/mock-interview/sessions/[sessionId] - Update a session
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { sessionId } = await params
    const id = parseInt(sessionId, 10)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      status,
      currentQuestionIndex,
      overallScore,
      summaryFeedback,
      strengthAreas,
      improvementAreas,
      startedAt,
      completedAt,
    } = body

    // Get the current session to check if it exists
    const existingSession = await db.query.mockInterviewSessions.findFirst({
      where: eq(mockInterviewSessions.id, id),
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    // Build update object
    const updates: Partial<typeof mockInterviewSessions.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (status !== undefined) {
      if (!["setup", "in_progress", "completed", "abandoned"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        )
      }
      updates.status = status
    }

    if (currentQuestionIndex !== undefined) {
      updates.currentQuestionIndex = currentQuestionIndex
    }

    if (overallScore !== undefined) {
      updates.overallScore = overallScore
    }

    if (summaryFeedback !== undefined) {
      updates.summaryFeedback = summaryFeedback
    }

    if (strengthAreas !== undefined) {
      updates.strengthAreasJson = JSON.stringify(strengthAreas)
    }

    if (improvementAreas !== undefined) {
      updates.improvementAreasJson = JSON.stringify(improvementAreas)
    }

    if (startedAt !== undefined) {
      updates.startedAt = new Date(startedAt)
    }

    if (completedAt !== undefined) {
      updates.completedAt = new Date(completedAt)
    }

    // Update the session
    await db
      .update(mockInterviewSessions)
      .set(updates)
      .where(eq(mockInterviewSessions.id, id))

    // Note: Metrics are updated by the mock-interviewer agent's handleEnd function,
    // which has complete category score information. We don't update metrics here
    // to avoid double-counting completed sessions.

    // Fetch updated session
    const updatedSession = await db.query.mockInterviewSessions.findFirst({
      where: eq(mockInterviewSessions.id, id),
      with: {
        resumeAnalysis: true,
        responses: {
          orderBy: (responses, { asc }) => [asc(responses.orderIndex)],
        },
      },
    })

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error("Error updating mock interview session:", error)
    return NextResponse.json(
      { error: "Failed to update mock interview session" },
      { status: 500 }
    )
  }
}

// DELETE /api/mock-interview/sessions/[sessionId] - Delete a session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { sessionId } = await params
    const id = parseInt(sessionId, 10)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 }
      )
    }

    // Get the session to check if it exists and get jobApplicationId
    const existingSession = await db.query.mockInterviewSessions.findFirst({
      where: eq(mockInterviewSessions.id, id),
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    // Delete associated responses first
    await db
      .delete(mockInterviewResponses)
      .where(eq(mockInterviewResponses.sessionId, id))

    // Delete the session
    await db
      .delete(mockInterviewSessions)
      .where(eq(mockInterviewSessions.id, id))

    // Update metrics
    const metrics = await db.query.mockInterviewMetrics.findFirst({
      where: eq(mockInterviewMetrics.jobApplicationId, existingSession.jobApplicationId),
    })

    if (metrics) {
      const newTotalSessions = Math.max(0, (metrics.totalSessions || 0) - 1)
      const newCompletedSessions =
        existingSession.status === "completed"
          ? Math.max(0, (metrics.completedSessions || 0) - 1)
          : metrics.completedSessions

      await db
        .update(mockInterviewMetrics)
        .set({
          totalSessions: newTotalSessions,
          completedSessions: newCompletedSessions,
          updatedAt: new Date(),
        })
        .where(eq(mockInterviewMetrics.jobApplicationId, existingSession.jobApplicationId))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting mock interview session:", error)
    return NextResponse.json(
      { error: "Failed to delete mock interview session" },
      { status: 500 }
    )
  }
}
