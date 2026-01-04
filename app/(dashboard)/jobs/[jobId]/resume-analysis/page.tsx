import { notFound } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { jobApplications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { ArrowLeft, RefreshCw, FileText, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { safeJsonParse } from "@/lib/utils/safe-json"
import {
  FitScoreGauge,
  StrengthsWeaknesses,
  EnhancementSuggestions,
  SkillGaps,
  InterviewQuestions,
} from "@/components/analysis"
import { AnalyzeButton } from "@/components/analysis/analyze-button"

type PageProps = { params: Promise<{ jobId: string }> }

async function getJobWithAnalysis(jobId: number) {
  return db.query.jobApplications.findFirst({
    where: eq(jobApplications.id, jobId),
    with: {
      company: true,
      resume: true,
      analyses: {
        with: {
          interviewQuestions: true,
        },
        orderBy: (analyses, { desc }) => [desc(analyses.createdAt)],
        limit: 1,
      },
    },
  })
}

export default async function ResumeAnalysisPage({ params }: PageProps) {
  const { jobId } = await params
  const id = parseInt(jobId, 10)

  if (isNaN(id)) {
    notFound()
  }

  const job = await getJobWithAnalysis(id)

  if (!job) {
    notFound()
  }

  const analysis = job.analyses?.[0]
  const hasResume = !!job.resume

  // Parse JSON fields from analysis using safe parsing
  const strengths = safeJsonParse(analysis?.strengthsJson, [])
  const weaknesses = safeJsonParse(analysis?.weaknessesJson, [])
  const enhancements = safeJsonParse(analysis?.enhancementSuggestionsJson, [])
  const skillGaps = safeJsonParse(analysis?.skillGapsJson, [])
  const matchedKeywords = safeJsonParse(analysis?.keywordsMatchedJson, [])
  const missingKeywords = safeJsonParse(analysis?.keywordsMissingJson, [])
  const interviewQuestions = analysis?.interviewQuestions || []

  return (
    <div className="flex flex-col">
      <Header title="Resume Analysis" />

      <div className="p-6 space-y-6">
        {/* Back Link */}
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {job.title}
        </Link>

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Resume Analysis</h1>
            <p className="text-muted-foreground">
              {job.title} {job.company && `at ${job.company.name}`}
            </p>
          </div>

          <AnalyzeButton
            jobId={job.id}
            hasResume={hasResume}
            hasAnalysis={!!analysis}
          />
        </div>

        {/* No Resume Warning */}
        {!hasResume && (
          <Card className="border-warning">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <FileText className="h-8 w-8 text-warning" />
                <div>
                  <h3 className="font-medium">Resume Required</h3>
                  <p className="text-sm text-muted-foreground">
                    Please upload your resume first to run an analysis.
                  </p>
                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="link" className="p-0 h-auto mt-1">
                      Go to job details to upload
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis ? (
          <div className="space-y-6">
            {/* Analysis Meta */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Analyzed {formatDistanceToNow(analysis.createdAt!, { addSuffix: true })}
              </span>
            </div>

            {/* Fit Score Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Fit</CardTitle>
                <CardDescription>
                  How well your resume matches this job description
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <FitScoreGauge score={analysis.fitScore || 0} size="lg" />
                  <div className="flex-1">
                    <p className="text-muted-foreground">{analysis.overallSummary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strengths and Weaknesses */}
            <StrengthsWeaknesses strengths={strengths} weaknesses={weaknesses} />

            {/* Enhancement Suggestions */}
            <EnhancementSuggestions enhancements={enhancements} />

            {/* Skill Gaps */}
            <SkillGaps
              skillGaps={skillGaps}
              matchedKeywords={matchedKeywords}
              missingKeywords={missingKeywords}
            />

            {/* Interview Questions */}
            <InterviewQuestions questions={interviewQuestions} />
          </div>
        ) : hasResume ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Click the &quot;Analyze Resume&quot; button above to get insights on how well
                your resume matches this job description.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
