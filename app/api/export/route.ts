import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jobApplications, resumeAnalyses, companyResearch, coverLetters } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { safeJsonParse } from "@/lib/utils/safe-json"
import { requireAuth } from "@/lib/auth/middleware"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/export - Generate a report for a job application
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { jobApplicationId, format = "json" } = body

    if (!jobApplicationId) {
      return NextResponse.json(
        { error: "Job application ID is required" },
        { status: 400 }
      )
    }

    // Fetch all data for the job application
    const job = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.id, jobApplicationId),
      with: {
        company: true,
        resume: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Get latest analysis
    const analysis = await db.query.resumeAnalyses.findFirst({
      where: eq(resumeAnalyses.jobApplicationId, jobApplicationId),
      orderBy: [desc(resumeAnalyses.createdAt)],
      with: {
        interviewQuestions: true,
      },
    })

    // Get company research if company exists
    let research = null
    if (job.companyId) {
      research = await db.query.companyResearch.findFirst({
        where: eq(companyResearch.companyId, job.companyId),
        orderBy: [desc(companyResearch.createdAt)],
        with: {
          leadershipTeam: true,
          news: true,
          legalIssues: true,
        },
      })
    }

    // Get latest cover letter
    const coverLetter = await db.query.coverLetters.findFirst({
      where: eq(coverLetters.jobApplicationId, jobApplicationId),
      orderBy: [desc(coverLetters.createdAt)],
    })

    // Build report data using safe JSON parsing
    const report = {
      generatedAt: new Date().toISOString(),
      jobApplication: {
        title: job.title,
        company: job.company?.name,
        status: job.status,
        jobDescriptionUrl: job.jobDescriptionUrl,
        appliedAt: job.appliedAt,
        notes: job.notes,
      },
      resumeAnalysis: analysis
        ? {
            fitScore: analysis.fitScore,
            summary: analysis.overallSummary,
            strengths: safeJsonParse(analysis.strengthsJson, []),
            weaknesses: safeJsonParse(analysis.weaknessesJson, []),
            enhancements: safeJsonParse(analysis.enhancementSuggestionsJson, []),
            skillGaps: safeJsonParse(analysis.skillGapsJson, []),
            keywordsMatched: safeJsonParse(analysis.keywordsMatchedJson, []),
            keywordsMissing: safeJsonParse(analysis.keywordsMissingJson, []),
            interviewQuestions: analysis.interviewQuestions,
          }
        : null,
      companyResearch: research
        ? {
            overview: safeJsonParse(research.coreBusinessJson, null),
            culture: safeJsonParse(research.cultureValuesJson, null),
            ethicsAlignment: safeJsonParse(research.ethicsAlignmentJson, null),
            leadership: research.leadershipTeam,
            news: research.news,
            legalIssues: research.legalIssues,
          }
        : null,
      coverLetter: coverLetter
        ? {
            content: coverLetter.isEdited && coverLetter.editedContent
              ? coverLetter.editedContent
              : coverLetter.fullContent,
            tone: coverLetter.tone,
            length: coverLetter.length,
            version: coverLetter.versionNumber,
            isEdited: coverLetter.isEdited,
          }
        : null,
    }

    if (format === "json") {
      return NextResponse.json(report)
    }

    // For markdown format
    if (format === "markdown") {
      const markdown = generateMarkdownReport(report)
      return new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="${job.title.replace(/[^a-z0-9]/gi, "_")}_report.md"`,
        },
      })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error generating export:", error)
    return NextResponse.json(
      { error: "Failed to generate export" },
      { status: 500 }
    )
  }
}

function generateMarkdownReport(report: Record<string, unknown>): string {
  const job = report.jobApplication as Record<string, unknown>
  const analysis = report.resumeAnalysis as Record<string, unknown> | null
  const research = report.companyResearch as Record<string, unknown> | null
  const coverLetter = report.coverLetter as { content: string; tone: string; length: string; version: number; isEdited: boolean } | null

  let md = `# Job Application Report\n\n`
  md += `Generated: ${report.generatedAt}\n\n`

  md += `## Position Details\n\n`
  md += `- **Title:** ${job.title}\n`
  md += `- **Company:** ${job.company || "N/A"}\n`
  md += `- **Status:** ${job.status}\n`
  if (job.appliedAt) md += `- **Applied:** ${job.appliedAt}\n`
  if (job.notes) md += `\n**Notes:** ${job.notes}\n`

  if (analysis) {
    md += `\n---\n\n## Resume Analysis\n\n`
    md += `### Fit Score: ${analysis.fitScore}%\n\n`
    md += `${analysis.summary}\n\n`

    const strengths = analysis.strengths as Array<{ area: string; description: string }>
    if (strengths?.length) {
      md += `### Strengths\n\n`
      strengths.forEach((s) => {
        md += `- **${s.area}:** ${s.description}\n`
      })
    }

    const weaknesses = analysis.weaknesses as Array<{ area: string; description: string; suggestion: string }>
    if (weaknesses?.length) {
      md += `\n### Areas for Improvement\n\n`
      weaknesses.forEach((w) => {
        md += `- **${w.area}:** ${w.description}\n  - *Suggestion:* ${w.suggestion}\n`
      })
    }

    const questions = analysis.interviewQuestions as Array<{ question: string; category: string; suggestedAnswer: string }>
    if (questions?.length) {
      md += `\n### Interview Questions\n\n`
      questions.forEach((q, i) => {
        md += `${i + 1}. **${q.question}** (${q.category})\n`
        md += `   > ${q.suggestedAnswer}\n\n`
      })
    }
  }

  if (research) {
    md += `\n---\n\n## Company Research\n\n`

    const overview = research.overview as Record<string, unknown>
    if (overview) {
      md += `### Overview\n\n`
      md += `${overview.description || ""}\n\n`
      if (overview.industry) md += `- **Industry:** ${overview.industry}\n`
      if (overview.headquarters) md += `- **Headquarters:** ${overview.headquarters}\n`
      if (overview.employeeCount) md += `- **Employees:** ${overview.employeeCount}\n`
    }

    const leadership = research.leadership as Array<{ name: string; title: string; bio?: string }>
    if (leadership?.length) {
      md += `\n### Leadership\n\n`
      leadership.forEach((l) => {
        md += `- **${l.name}** - ${l.title}\n`
        if (l.bio) md += `  ${l.bio}\n`
      })
    }

    const ethics = research.ethicsAlignment as { score: number; recommendation: string; positiveFactors: string[]; concerns: string[] }
    if (ethics) {
      md += `\n### Ethics Alignment\n\n`
      md += `**Score:** ${ethics.score}/10\n\n`
      md += `${ethics.recommendation}\n`
    }
  }

  if (coverLetter) {
    md += `\n---\n\n## Cover Letter\n\n`
    md += `**Tone:** ${coverLetter.tone} | **Length:** ${coverLetter.length} | **Version:** ${coverLetter.version}`
    if (coverLetter.isEdited) md += ` (Edited)`
    md += `\n\n`
    md += `${coverLetter.content}\n`
  }

  return md
}
