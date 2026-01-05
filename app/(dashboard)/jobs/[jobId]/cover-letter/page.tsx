import { notFound } from "next/navigation"
import Link from "next/link"
import { use } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { db } from "@/lib/db"
import { jobApplications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { ArrowLeft, FileText, AlertCircle } from "lucide-react"
import { safeJsonParse } from "@/lib/utils/safe-json"
import { CoverLetterGenerator } from "@/components/cover-letter/cover-letter-generator"
import { CoverLetterList } from "@/components/cover-letter/cover-letter-list"

type PageProps = { params: Promise<{ jobId: string }> }

async function getJobWithCoverLetters(jobId: number) {
  return db.query.jobApplications.findFirst({
    where: eq(jobApplications.id, jobId),
    with: {
      company: true,
      resume: true,
      coverLetters: {
        orderBy: (letters, { desc }) => [desc(letters.createdAt)],
      },
      analyses: {
        orderBy: (analyses, { desc }) => [desc(analyses.createdAt)],
        limit: 1,
      },
    },
  })
}

export default function CoverLetterPage({ params }: PageProps) {
  const { jobId } = use(params)
  const id = parseInt(jobId, 10)

  if (isNaN(id)) {
    notFound()
  }

  const job = use(getJobWithCoverLetters(id))

  if (!job) {
    notFound()
  }

  const hasResume = !!job.resume
  const hasAnalysis = (job.analyses?.length || 0) > 0
  const coverLetters = (job.coverLetters || []).map((letter) => ({
    ...letter,
    bodyParagraphs: safeJsonParse(letter.bodyParagraphs, []),
    isEdited: letter.isEdited ?? false,
    useAnalysisInsights: letter.useAnalysisInsights ?? true,
  }))

  return (
    <div className="flex flex-col">
      <Header title="Cover Letter" />

      <div className="p-6 space-y-6">
        {/* Back Link */}
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {job.title}
        </Link>

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Cover Letter Generator
            </h1>
            <p className="text-muted-foreground">
              {job.title} {job.company && `at ${job.company.name}`}
            </p>
          </div>
        </div>

        {/* No Resume Warning */}
        {!hasResume && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <div>
                  <h3 className="font-medium">Resume Required</h3>
                  <p className="text-sm text-muted-foreground">
                    Please upload your resume first to generate a cover letter.
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

        {/* Generator Component */}
        {hasResume && (
          <CoverLetterGenerator
            jobId={job.id}
            hasAnalysis={hasAnalysis}
            hasCoverLetters={coverLetters.length > 0}
          />
        )}

        {/* Cover Letters List */}
        {coverLetters.length > 0 && (
          <CoverLetterList
            initialLetters={coverLetters}
            jobId={job.id}
          />
        )}

        {/* Empty State */}
        {hasResume && coverLetters.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Cover Letters Yet</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Use the generator above to create a personalized cover letter
                tailored to this job description.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
