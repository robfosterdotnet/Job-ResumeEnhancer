import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  jobApplications,
  companies,
  resumes,
  resumeAnalyses,
  interviewQuestions,
  companyResearch,
  leadershipTeam,
  companyNews,
  legalIssues,
  chatSessions,
  chatMessages,
  mockInterviewSessions,
  mockInterviewResponses,
  mockInterviewMetrics,
  coverLetters,
  activityLogs,
} from "@/lib/db/schema"
import { eq, inArray } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"
import { logActivity } from "@/lib/activity/logger"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteParams = { params: Promise<{ jobId: string }> }

// GET /api/jobs/[jobId] - Get a single job application
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { jobId } = await params
    const id = parseInt(jobId, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 })
    }

    const job = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.id, id),
      with: {
        company: true,
        resume: true,
        analyses: {
          with: {
            interviewQuestions: true,
          },
        },
        chatSessions: {
          with: {
            messages: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error("Error fetching job:", error)
    return NextResponse.json(
      { error: "Failed to fetch job application" },
      { status: 500 }
    )
  }
}

// PUT /api/jobs/[jobId] - Update a job application
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { jobId } = await params
    const id = parseInt(jobId, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 })
    }

    // Get current job state for tracking changes
    const currentJob = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.id, id),
      with: { company: true },
    })

    if (!currentJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, companyName, jobDescriptionText, jobDescriptionUrl, status, notes, appliedAt, interviewDate, followUpDate, pipelineOrder } = body

    // Handle company update
    let companyId: number | undefined
    if (companyName) {
      const existingCompany = await db.query.companies.findFirst({
        where: eq(companies.name, companyName),
      })

      if (existingCompany) {
        companyId = existingCompany.id
      } else {
        const [newCompany] = await db
          .insert(companies)
          .values({ name: companyName })
          .returning()
        companyId = newCompany.id
      }
    }

    // Update job application
    const updateData: Partial<typeof jobApplications.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (title !== undefined) updateData.title = title
    if (companyId !== undefined) updateData.companyId = companyId
    if (jobDescriptionText !== undefined) updateData.jobDescriptionText = jobDescriptionText
    if (jobDescriptionUrl !== undefined) updateData.jobDescriptionUrl = jobDescriptionUrl
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (appliedAt !== undefined) updateData.appliedAt = appliedAt ? new Date(appliedAt) : null
    if (interviewDate !== undefined) updateData.interviewDate = interviewDate ? new Date(interviewDate) : null
    if (followUpDate !== undefined) updateData.followUpDate = followUpDate ? new Date(followUpDate) : null
    if (pipelineOrder !== undefined) updateData.pipelineOrder = pipelineOrder

    await db
      .update(jobApplications)
      .set(updateData)
      .where(eq(jobApplications.id, id))

    const updatedJob = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.id, id),
      with: {
        company: true,
        resume: true,
      },
    })

    // Log status change activity
    if (status !== undefined && status !== currentJob.status) {
      await logActivity({
        jobApplicationId: id,
        activityType: "status_changed",
        title: `Updated "${currentJob.title}" status to ${status}`,
        description: `Status changed from ${currentJob.status} to ${status}`,
        metadata: { oldStatus: currentJob.status, newStatus: status },
      })
    }

    // Log interview scheduling
    if (interviewDate !== undefined && interviewDate !== null) {
      await logActivity({
        jobApplicationId: id,
        activityType: "interview_scheduled",
        title: `Interview scheduled for "${currentJob.title}"`,
        description: `Interview date set to ${new Date(interviewDate).toLocaleDateString()}`,
        metadata: { interviewDate },
      })
    }

    return NextResponse.json({ job: updatedJob })
  } catch (error) {
    console.error("Error updating job:", error)
    return NextResponse.json(
      { error: "Failed to update job application" },
      { status: 500 }
    )
  }
}

// DELETE /api/jobs/[jobId] - Delete a job application and all related data
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { jobId } = await params
    const id = parseInt(jobId, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 })
    }

    // Get the job to find associated resume ID
    const job = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.id, id),
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Delete in correct order to respect foreign key constraints

    // 1. Delete chat messages (child of chat sessions)
    const sessions = await db.query.chatSessions.findMany({
      where: eq(chatSessions.jobApplicationId, id),
    })
    if (sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id)
      await db.delete(chatMessages).where(inArray(chatMessages.sessionId, sessionIds))
    }

    // 2. Delete chat sessions
    await db.delete(chatSessions).where(eq(chatSessions.jobApplicationId, id))

    // 3. Delete mock interview responses (child of mock interview sessions)
    const mockSessions = await db.query.mockInterviewSessions.findMany({
      where: eq(mockInterviewSessions.jobApplicationId, id),
    })
    if (mockSessions.length > 0) {
      const mockSessionIds = mockSessions.map(s => s.id)
      await db.delete(mockInterviewResponses).where(inArray(mockInterviewResponses.sessionId, mockSessionIds))
    }

    // 4. Delete mock interview sessions
    await db.delete(mockInterviewSessions).where(eq(mockInterviewSessions.jobApplicationId, id))

    // 5. Delete mock interview metrics
    await db.delete(mockInterviewMetrics).where(eq(mockInterviewMetrics.jobApplicationId, id))

    // 6. Delete interview questions (child of resume analyses)
    const analyses = await db.query.resumeAnalyses.findMany({
      where: eq(resumeAnalyses.jobApplicationId, id),
    })
    if (analyses.length > 0) {
      const analysisIds = analyses.map(a => a.id)
      await db.delete(interviewQuestions).where(inArray(interviewQuestions.resumeAnalysisId, analysisIds))
    }

    // 7. Delete resume analyses
    await db.delete(resumeAnalyses).where(eq(resumeAnalyses.jobApplicationId, id))

    // 8. Delete company research related data (leadership, news, legal issues)
    const research = await db.query.companyResearch.findMany({
      where: eq(companyResearch.jobApplicationId, id),
    })
    if (research.length > 0) {
      const researchIds = research.map(r => r.id)
      await db.delete(leadershipTeam).where(inArray(leadershipTeam.companyResearchId, researchIds))
      await db.delete(companyNews).where(inArray(companyNews.companyResearchId, researchIds))
      await db.delete(legalIssues).where(inArray(legalIssues.companyResearchId, researchIds))
    }

    // 9. Delete company research
    await db.delete(companyResearch).where(eq(companyResearch.jobApplicationId, id))

    // 10. Delete cover letters
    await db.delete(coverLetters).where(eq(coverLetters.jobApplicationId, id))

    // 11. Delete activity logs
    await db.delete(activityLogs).where(eq(activityLogs.jobApplicationId, id))

    // 12. Delete the job application itself
    await db.delete(jobApplications).where(eq(jobApplications.id, id))

    // 13. Delete the associated resume if it exists and is not shared
    if (job.resumeId) {
      // Check if any other job uses this resume
      const otherJobs = await db.query.jobApplications.findFirst({
        where: eq(jobApplications.resumeId, job.resumeId),
      })
      if (!otherJobs) {
        await db.delete(resumes).where(eq(resumes.id, job.resumeId))
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting job:", error)
    return NextResponse.json(
      { error: "Failed to delete job application" },
      { status: 500 }
    )
  }
}
