import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jobApplications, companies } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"

// GET /api/jobs - List all job applications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)

    type JobStatus = "saved" | "analyzing" | "analyzed" | "applied" | "interviewing" | "offered" | "accepted" | "rejected" | "withdrawn"
    const validStatuses: JobStatus[] = ["saved", "analyzing", "analyzed", "applied", "interviewing", "offered", "accepted", "rejected", "withdrawn"]
    const statusFilter = status && validStatuses.includes(status as JobStatus) ? status as JobStatus : undefined

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
  try {
    const body = await request.json()
    const { title, companyName, jobDescriptionText, jobDescriptionUrl, notes } = body

    if (!title || !jobDescriptionText) {
      return NextResponse.json(
        { error: "Title and job description are required" },
        { status: 400 }
      )
    }

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

    return NextResponse.json({ job: fullJob }, { status: 201 })
  } catch (error) {
    console.error("Error creating job:", error)
    return NextResponse.json(
      { error: "Failed to create job application" },
      { status: 500 }
    )
  }
}
