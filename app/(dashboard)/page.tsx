import { Header } from "@/components/dashboard/header"
import { MetricsBar } from "@/components/dashboard/metrics-bar"
import { JobPipeline } from "@/components/dashboard/job-pipeline"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { SkillGapChart } from "@/components/dashboard/skill-gap-chart"
import { ReadinessScore } from "@/components/dashboard/readiness-score"
import { Suggestions } from "@/components/dashboard/suggestions"
import { QuickActions, QuickActionsDesktop } from "@/components/dashboard/quick-actions"
import { db } from "@/lib/db"
import {
  jobApplications,
  resumeAnalyses,
  coverLetters,
  mockInterviewSessions,
  activityLogs,
  aggregatedSkillGaps,
} from "@/lib/db/schema"
import { desc, eq, count, avg } from "drizzle-orm"

async function getDashboardStats() {
  const allJobs = await db.query.jobApplications.findMany({
    columns: { status: true, createdAt: true },
  })

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

  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const thisWeek = allJobs.filter(
    (j) => j.createdAt && j.createdAt >= oneWeekAgo
  ).length
  const lastWeek = allJobs.filter(
    (j) => j.createdAt && j.createdAt >= twoWeeksAgo && j.createdAt < oneWeekAgo
  ).length

  const [avgFitResult] = await db
    .select({ avg: avg(resumeAnalyses.fitScore) })
    .from(resumeAnalyses)

  const [coverLetterCount] = await db.select({ count: count() }).from(coverLetters)
  const [mockInterviewCount] = await db
    .select({ count: count() })
    .from(mockInterviewSessions)
    .where(eq(mockInterviewSessions.status, "completed"))

  const appliedOrBeyond =
    byStatus.applied + byStatus.interviewing + byStatus.offered + byStatus.accepted
  const gotResponse = byStatus.interviewing + byStatus.offered + byStatus.accepted
  const responseRate = appliedOrBeyond > 0 ? Math.round((gotResponse / appliedOrBeyond) * 100) : 0

  return {
    total: allJobs.length,
    byStatus,
    avgFitScore: avgFitResult.avg ? Math.round(Number(avgFitResult.avg)) : 0,
    thisWeek,
    weeklyDelta: thisWeek - lastWeek,
    interviewsScheduled: byStatus.interviewing || 0,
    coverLettersGenerated: coverLetterCount.count,
    mockInterviewsCompleted: mockInterviewCount.count,
    responseRate,
  }
}

async function getJobsForPipeline() {
  const jobs = await db.query.jobApplications.findMany({
    with: {
      company: true,
      analyses: {
        orderBy: [desc(resumeAnalyses.createdAt)],
        limit: 1,
      },
    },
    orderBy: [desc(jobApplications.createdAt)],
  })

  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company?.name || null,
    fitScore: job.analyses[0]?.fitScore || null,
    status: job.status || "saved",
    pipelineOrder: job.pipelineOrder || 0,
  }))
}

async function getRecentActivities() {
  const activities = await db.query.activityLogs.findMany({
    with: {
      jobApplication: {
        with: { company: true },
      },
    },
    orderBy: [desc(activityLogs.createdAt)],
    limit: 21,
  })

  return {
    activities: activities.slice(0, 20).map((a) => ({
      id: a.id,
      activityType: a.activityType,
      title: a.title,
      description: a.description,
      createdAt: a.createdAt?.toISOString() || new Date().toISOString(),
      jobApplication: a.jobApplication
        ? {
            id: a.jobApplication.id,
            title: a.jobApplication.title,
            company: a.jobApplication.company?.name || null,
          }
        : null,
    })),
    hasMore: activities.length > 20,
  }
}

async function getSkillGaps() {
  const gaps = await db.query.aggregatedSkillGaps.findMany({
    orderBy: [desc(aggregatedSkillGaps.occurrenceCount)],
  })

  const [totalJobs] = await db.select({ count: count() }).from(jobApplications)

  return {
    skillGaps: gaps.map((gap) => ({
      id: gap.id,
      skill: gap.skill,
      occurrenceCount: gap.occurrenceCount || 0,
      percentage:
        totalJobs.count > 0
          ? Math.round(((gap.occurrenceCount || 0) / totalJobs.count) * 100)
          : 0,
      isLearned: gap.isLearned || false,
    })),
    totalJobs: totalJobs.count,
  }
}

async function getInterviewReadiness() {
  const metrics = await db.query.mockInterviewMetrics.findMany()

  if (metrics.length === 0) {
    return {
      overallScore: 0,
      categories: [],
      totalSessions: 0,
    }
  }

  // Aggregate across all metrics
  const totalSessions = metrics.reduce((sum, m) => sum + (m.completedSessions || 0), 0)
  const avgScore =
    metrics.reduce((sum, m) => sum + (m.averageScore || 0), 0) / metrics.length

  // Get category averages
  const behavioralScores = metrics.filter((m) => m.behavioralAvgScore).map((m) => m.behavioralAvgScore!)
  const technicalScores = metrics.filter((m) => m.technicalAvgScore).map((m) => m.technicalAvgScore!)
  const situationalScores = metrics.filter((m) => m.situationalAvgScore).map((m) => m.situationalAvgScore!)

  const categories = [
    {
      category: "Behavioral",
      score: behavioralScores.length > 0
        ? Math.round(behavioralScores.reduce((a, b) => a + b, 0) / behavioralScores.length)
        : null,
    },
    {
      category: "Technical",
      score: technicalScores.length > 0
        ? Math.round(technicalScores.reduce((a, b) => a + b, 0) / technicalScores.length)
        : null,
    },
    {
      category: "Situational",
      score: situationalScores.length > 0
        ? Math.round(situationalScores.reduce((a, b) => a + b, 0) / situationalScores.length)
        : null,
    },
  ].filter((c) => c.score !== null)

  // Find weakest category
  const weakest = categories.reduce(
    (min, c) => ((c.score || 100) < (min?.score || 100) ? c : min),
    categories[0]
  )

  return {
    overallScore: Math.round(avgScore),
    categories,
    weakestCategory: weakest?.category,
    totalSessions,
  }
}

async function getSuggestions() {
  const jobs = await db.query.jobApplications.findMany({
    with: {
      company: true,
      resume: true,
      analyses: true,
      mockInterviewMetrics: true,
    },
    orderBy: [desc(jobApplications.createdAt)],
  })

  const suggestions: Array<{
    id: string
    priority: "high" | "medium" | "low"
    type: "action" | "reminder" | "tip"
    title: string
    description: string
    actionUrl?: string
    jobApplicationId?: number
  }> = []

  // Jobs with resume but no analysis
  const needsAnalysis = jobs.filter(
    (j) => j.resume && j.analyses.length === 0 && j.status === "saved"
  )
  if (needsAnalysis.length > 0) {
    const job = needsAnalysis[0]
    suggestions.push({
      id: `analyze-${job.id}`,
      priority: "high",
      type: "action",
      title: `Analyze resume for "${job.title}"`,
      description: "Get your fit score and interview prep questions.",
      actionUrl: `/jobs/${job.id}`,
      jobApplicationId: job.id,
    })
  }

  // Strong fits not yet applied
  const strongFits = jobs.filter(
    (j) =>
      j.status === "analyzed" &&
      j.analyses.length > 0 &&
      (j.analyses[0].fitScore ?? 0) >= 70
  )
  if (strongFits.length > 0) {
    const job = strongFits[0]
    suggestions.push({
      id: `apply-${job.id}`,
      priority: "high",
      type: "action",
      title: `Strong fit! Apply to "${job.title}"`,
      description: `Your fit score is ${job.analyses[0].fitScore}%`,
      actionUrl: `/jobs/${job.id}`,
      jobApplicationId: job.id,
    })
  }

  // Follow-ups needed
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const needsFollowUp = jobs.filter(
    (j) => j.status === "applied" && j.appliedAt && new Date(j.appliedAt) < sevenDaysAgo
  )
  needsFollowUp.slice(0, 1).forEach((job) => {
    const daysAgo = Math.floor(
      (Date.now() - new Date(job.appliedAt!).getTime()) / (1000 * 60 * 60 * 24)
    )
    suggestions.push({
      id: `followup-${job.id}`,
      priority: "medium",
      type: "reminder",
      title: `Follow up with ${job.company?.name || "company"}`,
      description: `Applied ${daysAgo} days ago`,
      actionUrl: `/jobs/${job.id}`,
      jobApplicationId: job.id,
    })
  })

  // Empty state
  if (jobs.length === 0) {
    suggestions.push({
      id: "welcome",
      priority: "high",
      type: "action",
      title: "Add your first job application",
      description: "Get started with your job search!",
      actionUrl: "/jobs/new",
    })
  }

  return suggestions.slice(0, 5)
}

export default async function DashboardPage() {
  const [stats, pipelineJobs, activityData, skillGapData, readiness, suggestions] =
    await Promise.all([
      getDashboardStats(),
      getJobsForPipeline(),
      getRecentActivities(),
      getSkillGaps(),
      getInterviewReadiness(),
      getSuggestions(),
    ])

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Dashboard" />

      <div className="p-6 space-y-6 pb-24 md:pb-6">
        {/* Quick Actions - Desktop */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <QuickActionsDesktop />
        </div>

        {/* Metrics Bar */}
        <MetricsBar stats={stats} />

        {/* Job Pipeline */}
        <JobPipeline initialJobs={pipelineJobs} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Activity Feed - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ActivityFeed
              initialActivities={activityData.activities}
              initialHasMore={activityData.hasMore}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ReadinessScore
              overallScore={readiness.overallScore}
              categories={readiness.categories}
              weakestCategory={readiness.weakestCategory}
              totalSessions={readiness.totalSessions}
            />

            <SkillGapChart
              initialSkillGaps={skillGapData.skillGaps}
              totalJobs={skillGapData.totalJobs}
            />

            <Suggestions suggestions={suggestions} />
          </div>
        </div>
      </div>

      {/* Quick Actions - Mobile */}
      <QuickActions />
    </div>
  )
}
