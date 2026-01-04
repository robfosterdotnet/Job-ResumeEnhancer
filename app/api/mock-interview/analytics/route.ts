import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { mockInterviewMetrics, mockInterviewSessions } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/mock-interview/analytics - Get performance analytics
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const jobApplicationId = searchParams.get("jobApplicationId")

    if (!jobApplicationId) {
      return NextResponse.json(
        { error: "jobApplicationId is required" },
        { status: 400 }
      )
    }

    const jobId = parseInt(jobApplicationId, 10)

    // Get metrics for this job application
    const metrics = await db.query.mockInterviewMetrics.findFirst({
      where: eq(mockInterviewMetrics.jobApplicationId, jobId),
    })

    // Get all completed sessions with responses
    const sessions = await db.query.mockInterviewSessions.findMany({
      where: eq(mockInterviewSessions.jobApplicationId, jobId),
      with: {
        responses: true,
      },
      orderBy: [desc(mockInterviewSessions.completedAt)],
    })

    // Calculate additional analytics
    const completedSessions = sessions.filter((s) => s.status === "completed")

    // Score distribution
    const scoreDistribution = {
      excellent: 0, // 80-100
      good: 0, // 60-79
      average: 0, // 40-59
      needsWork: 0, // 0-39
    }

    completedSessions.forEach((session) => {
      const score = session.overallScore
      if (score === null) return
      if (score >= 80) scoreDistribution.excellent++
      else if (score >= 60) scoreDistribution.good++
      else if (score >= 40) scoreDistribution.average++
      else scoreDistribution.needsWork++
    })

    // Category breakdown from all responses
    const categoryStats: Record<string, { total: number; count: number }> = {}
    completedSessions.forEach((session) => {
      session.responses.forEach((response) => {
        if (response.score === null || !response.questionCategory) return
        const cat = response.questionCategory
        if (!categoryStats[cat]) {
          categoryStats[cat] = { total: 0, count: 0 }
        }
        categoryStats[cat].total += response.score
        categoryStats[cat].count++
      })
    })

    const categoryBreakdown = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      averageScore: stats.count > 0 ? Math.round(stats.total / stats.count) : 0,
      questionsAnswered: stats.count,
    }))

    // Recent performance trend (last 10 sessions)
    const recentSessions = completedSessions.slice(0, 10).reverse()
    const performanceTrend = recentSessions.map((session) => ({
      date: session.completedAt,
      score: session.overallScore,
    }))

    // Parse score history if available
    let scoreHistory: Array<{ date: string; score: number }> = []
    if (metrics?.scoreHistoryJson) {
      try {
        scoreHistory = JSON.parse(metrics.scoreHistoryJson)
      } catch {
        scoreHistory = []
      }
    }

    // Calculate improvement rate
    let improvementRate = 0
    if (scoreHistory.length >= 2) {
      const firstHalf = scoreHistory.slice(0, Math.floor(scoreHistory.length / 2))
      const secondHalf = scoreHistory.slice(Math.floor(scoreHistory.length / 2))
      const firstHalfAvg =
        firstHalf.reduce((sum, s) => sum + s.score, 0) / firstHalf.length
      const secondHalfAvg =
        secondHalf.reduce((sum, s) => sum + s.score, 0) / secondHalf.length
      improvementRate = secondHalfAvg - firstHalfAvg
    }

    return NextResponse.json({
      metrics: metrics
        ? {
            totalSessions: metrics.totalSessions,
            completedSessions: metrics.completedSessions,
            averageScore: metrics.averageScore,
            strongestCategory: metrics.strongestCategory,
            weakestCategory: metrics.weakestCategory,
            behavioralAvgScore: metrics.behavioralAvgScore,
            technicalAvgScore: metrics.technicalAvgScore,
            situationalAvgScore: metrics.situationalAvgScore,
            companySpecificAvgScore: metrics.companySpecificAvgScore,
            roleSpecificAvgScore: metrics.roleSpecificAvgScore,
          }
        : null,
      scoreHistory,
      scoreDistribution,
      categoryBreakdown,
      performanceTrend,
      improvementRate: Math.round(improvementRate * 10) / 10,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
