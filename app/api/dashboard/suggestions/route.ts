import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  jobApplications,
  aggregatedSkillGaps,
} from "@/lib/db/schema"
import { desc, eq, and } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Suggestion {
  id: string
  priority: "high" | "medium" | "low"
  type: "action" | "reminder" | "tip"
  title: string
  description: string
  actionUrl?: string
  jobApplicationId?: number
}

// GET /api/dashboard/suggestions - Get AI-powered next step suggestions
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const suggestions: Suggestion[] = []

    // Get all jobs with their analyses and metrics
    const jobs = await db.query.jobApplications.findMany({
      with: {
        company: true,
        resume: true,
        analyses: true,
        mockInterviewMetrics: true,
      },
      orderBy: [desc(jobApplications.createdAt)],
    })

    // 1. Jobs with resume but no analysis
    const jobsNeedingAnalysis = jobs.filter(
      (j) => j.resume && j.analyses.length === 0 && j.status === "saved"
    )
    if (jobsNeedingAnalysis.length > 0) {
      const job = jobsNeedingAnalysis[0]
      suggestions.push({
        id: `analyze-${job.id}`,
        priority: "high",
        type: "action",
        title: `Analyze resume for "${job.title}"`,
        description: `You uploaded a resume but haven't analyzed it yet. Get your fit score and interview prep questions.`,
        actionUrl: `/jobs/${job.id}`,
        jobApplicationId: job.id,
      })
    }

    // 2. Jobs that are "analyzing" for too long (stuck)
    const stuckJobs = jobs.filter((j) => j.status === "analyzing")
    stuckJobs.forEach((job) => {
      suggestions.push({
        id: `stuck-${job.id}`,
        priority: "high",
        type: "action",
        title: `Resume analysis may have stalled`,
        description: `The analysis for "${job.title}" seems stuck. Try running it again.`,
        actionUrl: `/jobs/${job.id}`,
        jobApplicationId: job.id,
      })
    })

    // 3. Analyzed jobs not yet applied
    const analyzedNotApplied = jobs.filter(
      (j) =>
        j.status === "analyzed" &&
        j.analyses.length > 0 &&
        j.analyses[0].fitScore !== null &&
        j.analyses[0].fitScore >= 70
    )
    if (analyzedNotApplied.length > 0) {
      const job = analyzedNotApplied[0]
      const fitScore = job.analyses[0].fitScore
      suggestions.push({
        id: `apply-${job.id}`,
        priority: "high",
        type: "action",
        title: `Strong fit! Consider applying to "${job.title}"`,
        description: `Your fit score is ${fitScore}%. This looks like a great match!`,
        actionUrl: `/jobs/${job.id}`,
        jobApplicationId: job.id,
      })
    }

    // 4. Applied jobs needing follow-up (7+ days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const needsFollowUp = jobs.filter(
      (j) =>
        j.status === "applied" &&
        j.appliedAt &&
        new Date(j.appliedAt) < sevenDaysAgo
    )
    needsFollowUp.slice(0, 2).forEach((job) => {
      const daysAgo = Math.floor(
        (Date.now() - new Date(job.appliedAt!).getTime()) / (1000 * 60 * 60 * 24)
      )
      suggestions.push({
        id: `followup-${job.id}`,
        priority: "medium",
        type: "reminder",
        title: `Follow up with ${job.company?.name || "company"}`,
        description: `You applied to "${job.title}" ${daysAgo} days ago. Consider following up.`,
        actionUrl: `/jobs/${job.id}`,
        jobApplicationId: job.id,
      })
    })

    // 5. Upcoming interviews
    const now = new Date()
    const upcomingInterviews = jobs.filter(
      (j) => j.interviewDate && new Date(j.interviewDate) > now
    )
    upcomingInterviews.forEach((job) => {
      const interviewDate = new Date(job.interviewDate!)
      const daysUntil = Math.ceil(
        (interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysUntil <= 7) {
        suggestions.push({
          id: `interview-prep-${job.id}`,
          priority: "high",
          type: "reminder",
          title: `Interview in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}!`,
          description: `Prepare for your interview at ${job.company?.name || "the company"} for "${job.title}".`,
          actionUrl: `/jobs/${job.id}/mock-interview`,
          jobApplicationId: job.id,
        })
      }
    })

    // 6. Low mock interview scores - suggest practice
    const lowScoreJobs = jobs.filter(
      (j) =>
        j.mockInterviewMetrics &&
        j.mockInterviewMetrics.averageScore !== null &&
        j.mockInterviewMetrics.averageScore < 70
    )
    if (lowScoreJobs.length > 0) {
      const job = lowScoreJobs[0]
      const weakestCategory = job.mockInterviewMetrics?.weakestCategory
      suggestions.push({
        id: `practice-${job.id}`,
        priority: "medium",
        type: "tip",
        title: `Practice ${weakestCategory || "interview"} questions`,
        description: `Your mock interview score for "${job.title}" could use improvement. Focus on ${weakestCategory || "your weak areas"}.`,
        actionUrl: `/jobs/${job.id}/mock-interview`,
        jobApplicationId: job.id,
      })
    }

    // 7. Unlearned critical skill gaps
    const criticalSkillGaps = await db.query.aggregatedSkillGaps.findMany({
      where: and(
        eq(aggregatedSkillGaps.isLearned, false),
        // Skills appearing in 3+ jobs
      ),
      orderBy: [desc(aggregatedSkillGaps.occurrenceCount)],
      limit: 1,
    })

    if (criticalSkillGaps.length > 0 && (criticalSkillGaps[0].occurrenceCount || 0) >= 3) {
      const skill = criticalSkillGaps[0]
      suggestions.push({
        id: `skill-${skill.id}`,
        priority: "medium",
        type: "tip",
        title: `Learn ${skill.skill}`,
        description: `This skill appears in ${skill.occurrenceCount} of your target jobs. Consider adding it to your skillset.`,
        actionUrl: `/`,
      })
    }

    // 8. No jobs yet - welcome message
    if (jobs.length === 0) {
      suggestions.push({
        id: "welcome",
        priority: "high",
        type: "action",
        title: "Add your first job application",
        description: "Get started by adding a job you're interested in!",
        actionUrl: "/jobs/new",
      })
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return NextResponse.json({ suggestions: suggestions.slice(0, 5) })
  } catch (error) {
    console.error("Error generating suggestions:", error)
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    )
  }
}
