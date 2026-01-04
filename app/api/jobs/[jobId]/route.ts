import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jobApplications, companies } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

type RouteParams = { params: Promise<{ jobId: string }> }

// GET /api/jobs/[jobId] - Get a single job application
export async function GET(request: NextRequest, { params }: RouteParams) {
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
  try {
    const { jobId } = await params
    const id = parseInt(jobId, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 })
    }

    const body = await request.json()
    const { title, companyName, jobDescriptionText, jobDescriptionUrl, status, notes, appliedAt } = body

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
