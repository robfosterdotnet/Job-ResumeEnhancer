import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jobApplications, companies } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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

// DELETE /api/jobs/[jobId] - Delete a job application
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { jobId } = await params
    const id = parseInt(jobId, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 })
    }

    await db.delete(jobApplications).where(eq(jobApplications.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting job:", error)
    return NextResponse.json(
      { error: "Failed to delete job application" },
      { status: 500 }
    )
  }
}
