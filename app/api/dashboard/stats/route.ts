import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  resumeAnalyses,
  coverLetters,
  mockInterviewSessions,
} from "@/lib/db/schema"
import { count, avg, eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/dashboard/stats - Get aggregated dashboard statistics
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    // Get all jobs to count by status
    const allJobs = await db.query.jobApplications.findMany({
      columns: { status: true, createdAt: true },
    })

    // Count by status
    const byStatus: Record<string, number> = {
      saved: 0,
      analyzing: 0,
      analyzed: 0,
      applied: 0,
      interviewing: 0,
      offered: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    }

    allJobs.forEach((job) => {
      const status = job.status || "saved"
      byStatus[status] = (byStatus[status] || 0) + 1
    })

    // Calculate weekly counts
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const thisWeek = allJobs.filter(
      (j) => j.createdAt && j.createdAt >= oneWeekAgo
    ).length
    const lastWeek = allJobs.filter(
      (j) => j.createdAt && j.createdAt >= twoWeeksAgo && j.createdAt < oneWeekAgo
    ).length

    // Get average fit score
    const [avgFitResult] = await db
      .select({ avg: avg(resumeAnalyses.fitScore) })
      .from(resumeAnalyses)

    // Get cover letter count
    const [coverLetterCount] = await db
      .select({ count: count() })
      .from(coverLetters)

    // Get completed mock interviews
    const [mockInterviewCount] = await db
      .select({ count: count() })
      .from(mockInterviewSessions)
      .where(eq(mockInterviewSessions.status, "completed"))

    // Get interviews scheduled (jobs with interviewing status)
    const interviewingCount = byStatus.interviewing || 0

    // Calculate response rate (applied -> interviewing)
    const appliedOrBeyond =
      byStatus.applied +
      byStatus.interviewing +
      byStatus.offered +
      byStatus.accepted
    const gotResponse = byStatus.interviewing + byStatus.offered + byStatus.accepted
    const responseRate = appliedOrBeyond > 0 ? Math.round((gotResponse / appliedOrBeyond) * 100) : 0

    const stats = {
      total: allJobs.length,
      byStatus,
      avgFitScore: avgFitResult.avg ? Math.round(Number(avgFitResult.avg)) : 0,
      thisWeek,
      weeklyDelta: thisWeek - lastWeek,
      interviewsScheduled: interviewingCount,
      coverLettersGenerated: coverLetterCount.count,
      mockInterviewsCompleted: mockInterviewCount.count,
      responseRate,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    )
  }
}
