import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { jobApplications, companies } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { parseRequestBody } from "@/lib/utils/api-validation"
import { requireAuth } from "@/lib/auth/middleware"
import { logActivity } from "@/lib/activity/logger"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const jobStatusEnum = z.enum([
  "saved",
  "analyzing",
  "analyzed",
  "applied",
  "interviewing",
  "offered",
  "accepted",
  "rejected",
  "withdrawn",
])

const jobPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  companyName: z.string().optional(),
  jobDescriptionText: z.string().min(1, "Job description is required"),
  jobDescriptionUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
})

// GET /api/jobs - List all job applications
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100)
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0)

    const statusResult = jobStatusEnum.safeParse(status)
    const statusFilter = statusResult.success ? statusResult.data : undefined

    const jobs = await db.query.jobApplications.findMany({
      where: statusFilter ? eq(jobApplications.status, statusFilter) : undefined,
      with: {
        company: true,
        resume: true,
      },
      orderBy: [desc(jobApplications.createdAt)],
      limit,
      offset,
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json(
      { error: "Failed to fetch job applications" },
      { status: 500 }
    )
  }
}

// POST /api/jobs - Create a new job application
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const parsed = await parseRequestBody(request, jobPostSchema)
    if (!parsed.success) return parsed.response

    const { title, companyName, jobDescriptionText, jobDescriptionUrl, notes } = parsed.data

    // Create or find company
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

    // Create job application
    const [job] = await db
      .insert(jobApplications)
      .values({
        title,
        companyId,
        jobDescriptionText,
        jobDescriptionUrl,
        notes,
        status: "saved",
      })
      .returning()

    // Fetch with relations
    const fullJob = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.id, job.id),
      with: {
        company: true,
        resume: true,
      },
    })

    // Log activity
    await logActivity({
      jobApplicationId: job.id,
      activityType: "job_created",
      title: `Added "${title}" at ${companyName || "Unknown Company"}`,
      description: `New job application created`,
      metadata: { companyId, title },
    })

    return NextResponse.json({ job: fullJob }, { status: 201 })
  } catch (error) {
    console.error("Error creating job:", error)
    return NextResponse.json(
      { error: "Failed to create job application" },
      { status: 500 }
    )
  }
}
