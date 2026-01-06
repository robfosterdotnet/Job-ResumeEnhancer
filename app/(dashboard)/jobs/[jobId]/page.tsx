import { notFound } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { jobApplications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  Building2,
  Calendar,
  ExternalLink,
  ArrowLeft,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ActionsCard } from "@/components/jobs/actions-card"
import { DeleteJobButton } from "@/components/jobs/delete-job-button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type PageProps = { params: Promise<{ jobId: string }> }

const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  saved: "secondary",
  analyzing: "warning",
  analyzed: "default",
  applied: "success",
  interviewing: "success",
  offered: "success",
  accepted: "success",
  rejected: "destructive",
  withdrawn: "secondary",
}

async function getJob(jobId: number) {
  return db.query.jobApplications.findFirst({
    where: eq(jobApplications.id, jobId),
    with: {
      company: true,
      resume: true,
      analyses: {
        with: {
          interviewQuestions: true,
        },
      },
    },
  })
}

export default async function JobDetailPage({ params }: PageProps) {
  const { jobId } = await params
  const id = parseInt(jobId, 10)

  if (isNaN(id)) {
    notFound()
  }

  const job = await getJob(id)

  if (!job) {
    notFound()
  }

  const latestAnalysis = job.analyses?.[0]
  const hasAnalysis = !!latestAnalysis

  return (
    <div className="flex flex-col">
      <Header title={job.title} />

      <div className="p-6 space-y-6">
        {/* Back Link */}
        <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>

        {/* Job Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <Badge variant={statusColors[job.status || "saved"]}>
                {job.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              {job.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {job.company.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Added {formatDistanceToNow(job.createdAt!, { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {job.jobDescriptionUrl && (
              <a href={job.jobDescriptionUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Job Posting
                </Button>
              </a>
            )}
            <DeleteJobButton jobId={job.id} jobTitle={job.title} />
          </div>
        </div>

        {/* Quick Actions and Resume Upload */}
        <ActionsCard
          jobId={job.id}
          jobTitle={job.title}
          initialHasResume={!!job.resume}
          initialHasAnalysis={hasAnalysis}
          hasCompany={!!job.company}
          interviewQuestionsCount={latestAnalysis?.interviewQuestions?.length || 0}
          currentResume={job.resume || undefined}
        >
          {/* Analysis Summary */}
          {latestAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Analysis</CardTitle>
                <CardDescription>Resume fit score and key insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fit Score</span>
                  <span className="text-2xl font-bold text-primary">
                    {latestAnalysis.fitScore}%
                  </span>
                </div>
                {latestAnalysis.overallSummary && (
                  <p className="text-sm text-muted-foreground">
                    {latestAnalysis.overallSummary.substring(0, 200)}...
                  </p>
                )}
                <Link href={`/jobs/${job.id}/resume-analysis`}>
                  <Button variant="link" className="p-0">
                    View Full Analysis →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </ActionsCard>

        {/* Job Description */}
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none max-h-[600px] overflow-y-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {job.jobDescriptionText || ""}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {job.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{job.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
