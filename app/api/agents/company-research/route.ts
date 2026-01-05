import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  jobApplications,
  companies,
  companyResearch,
  leadershipTeam,
  companyNews,
  legalIssues,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { runCompanyResearch } from "@/lib/ai/agents/company-researcher"
import { requireAuth } from "@/lib/auth/middleware"
import { logActivity } from "@/lib/activity/logger"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Increase timeout for long-running AI research (5 minutes)
export const maxDuration = 300

// POST /api/agents/company-research - Run company research
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { jobApplicationId, companyId, companyName } = body

    // Get company - either by ID or create by name
    let company
    let resolvedCompanyName = companyName

    if (companyId) {
      company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
      })
      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        )
      }
      resolvedCompanyName = company.name
    } else if (companyName) {
      company = await db.query.companies.findFirst({
        where: eq(companies.name, companyName),
      })
      if (!company) {
        const [newCompany] = await db
          .insert(companies)
          .values({ name: companyName })
          .returning()
        company = newCompany
      }
    } else {
      return NextResponse.json(
        { error: "Company ID or company name is required" },
        { status: 400 }
      )
    }

    // Get job title if job application provided
    let jobTitle: string | undefined
    if (jobApplicationId) {
      const job = await db.query.jobApplications.findFirst({
        where: eq(jobApplications.id, jobApplicationId),
      })
      jobTitle = job?.title
    }

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const research = await runCompanyResearch({
            companyName: resolvedCompanyName,
            jobTitle,
            onProgress: (progress) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "progress", ...progress })}\n\n`)
              )
            },
          })

          // Update company with overview data
          await db
            .update(companies)
            .set({
              industry: research.overview.industry,
              description: research.overview.description,
              headquarters: research.overview.headquarters,
              employeeCount: research.overview.employeeCount,
              foundedYear: research.overview.foundedYear,
              website: research.overview.website,
              isPublic: research.financials?.isPublic,
              stockSymbol: research.financials?.stockSymbol,
              updatedAt: new Date(),
            })
            .where(eq(companies.id, company!.id))

          // Save research to database
          const [savedResearch] = await db
            .insert(companyResearch)
            .values({
              companyId: company!.id,
              jobApplicationId: jobApplicationId || null,
              researchSummary: research.overview.description,
              coreBusinessJson: JSON.stringify(research.overview),
              cultureValuesJson: JSON.stringify(research.culture),
              ethicsAlignmentJson: JSON.stringify(research.ethicsAlignment),
              rawResponseJson: JSON.stringify(research),
            })
            .returning()

          // Save leadership team
          if (research.leadership.length > 0) {
            await db.insert(leadershipTeam).values(
              research.leadership.map((leader) => ({
                companyResearchId: savedResearch.id,
                name: leader.name,
                title: leader.title,
                role: leader.role as typeof leadershipTeam.$inferInsert.role,
                bio: leader.bio,
              }))
            )
          }

          // Save news
          if (research.recentNews.length > 0) {
            await db.insert(companyNews).values(
              research.recentNews.map((news) => ({
                companyResearchId: savedResearch.id,
                title: news.title,
                summary: news.summary,
                sentiment: news.sentiment,
                sourceName: news.source,
              }))
            )
          }

          // Save legal issues
          if (research.legalIssues && research.legalIssues.length > 0) {
            await db.insert(legalIssues).values(
              research.legalIssues.map((issue) => ({
                companyResearchId: savedResearch.id,
                title: issue.title,
                description: issue.description,
                status: issue.status as typeof legalIssues.$inferInsert.status,
              }))
            )
          }

          // Log activity
          if (jobApplicationId) {
            const ethicsScore = research.ethicsAlignment?.score
            await logActivity({
              jobApplicationId,
              activityType: "research_completed",
              title: `Company research completed for ${resolvedCompanyName}`,
              description: ethicsScore !== null ? `Ethics Score: ${ethicsScore}/10 • ${research.recentNews.length} news items` : `${research.recentNews.length} news items found`,
              metadata: {
                researchId: savedResearch.id,
                companyId: company!.id,
                ethicsScore,
                newsCount: research.recentNews.length,
                legalIssuesCount: research.legalIssues?.length || 0,
              },
            })
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                researchId: savedResearch.id,
                research,
              })}\n\n`
            )
          )
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
    console.error("Error running company research:", error)
    return NextResponse.json(
      { error: "Failed to run company research" },
      { status: 500 }
    )
  }
}

// GET /api/agents/company-research?companyId=X - Get research results
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get("companyId")
    const jobApplicationId = searchParams.get("jobApplicationId")

    if (!companyId && !jobApplicationId) {
      return NextResponse.json(
        { error: "Company ID or job application ID is required" },
        { status: 400 }
      )
    }

    const research = await db.query.companyResearch.findMany({
      where: companyId
        ? eq(companyResearch.companyId, parseInt(companyId, 10))
        : eq(companyResearch.jobApplicationId, parseInt(jobApplicationId!, 10)),
      with: {
        company: true,
        leadershipTeam: true,
        news: true,
        legalIssues: true,
      },
      orderBy: (research, { desc }) => [desc(research.createdAt)],
    })

    return NextResponse.json({ research })
  } catch (error) {
    console.error("Error fetching research:", error)
    return NextResponse.json(
      { error: "Failed to fetch research" },
      { status: 500 }
    )
  }
}
