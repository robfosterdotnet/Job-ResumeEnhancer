import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { aggregatedSkillGaps, jobApplications } from "@/lib/db/schema"
import { desc, count, eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"
import { safeJsonParse } from "@/lib/utils/safe-json"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/dashboard/skill-gaps - Get aggregated skill gaps
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const includeLearnedParam = searchParams.get("includeLearned")
    const includeLearned = includeLearnedParam === "true"

    // Get all skill gaps, ordered by occurrence count
    const skillGaps = await db.query.aggregatedSkillGaps.findMany({
      where: includeLearned ? undefined : eq(aggregatedSkillGaps.isLearned, false),
      orderBy: [desc(aggregatedSkillGaps.occurrenceCount)],
    })

    // Get total job count for percentage calculation
    const [totalJobs] = await db.select({ count: count() }).from(jobApplications)

    // Format response with job IDs parsed
    const formattedGaps = skillGaps.map((gap) => ({
      id: gap.id,
      skill: gap.skill,
      occurrenceCount: gap.occurrenceCount || 0,
      percentage: totalJobs.count > 0
        ? Math.round(((gap.occurrenceCount || 0) / totalJobs.count) * 100)
        : 0,
      jobIds: safeJsonParse<number[]>(gap.jobIdsJson, []),
      isLearned: gap.isLearned || false,
      learnedAt: gap.learnedAt,
    }))

    // Summary stats
    const summary = {
      total: skillGaps.length,
      learned: skillGaps.filter((g) => g.isLearned).length,
      unlearned: skillGaps.filter((g) => !g.isLearned).length,
      totalJobs: totalJobs.count,
    }

    return NextResponse.json({ skillGaps: formattedGaps, summary })
  } catch (error) {
    console.error("Error fetching skill gaps:", error)
    return NextResponse.json(
      { error: "Failed to fetch skill gaps" },
      { status: 500 }
    )
  }
}
