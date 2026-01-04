import { notFound } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { db } from "@/lib/db"
import { jobApplications, companyResearch } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { ArrowLeft, Building2, Calendar, Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { safeJsonParse } from "@/lib/utils/safe-json"
import {
  CompanyOverview,
  LeadershipTeam,
  Financials,
  NewsFeed,
  LegalIssues,
  EthicsAlignment,
  GlassdoorInsights,
  ResearchButton,
} from "@/components/research"

type PageProps = { params: Promise<{ jobId: string }> }

async function getJobWithResearch(jobId: number) {
  return db.query.jobApplications.findFirst({
    where: eq(jobApplications.id, jobId),
    with: {
      company: true,
    },
  })
}

async function getCompanyResearch(companyId: number) {
  // Get the latest research for this company and job application
  const research = await db.query.companyResearch.findFirst({
    where: eq(companyResearch.companyId, companyId),
    with: {
      leadershipTeam: true,
      financialInfo: {
        orderBy: (financialInfo, { desc }) => [desc(financialInfo.fiscalYear)],
      },
      news: {
        orderBy: (news, { desc }) => [desc(news.publishedAt)],
      },
      legalIssues: {
        orderBy: (legalIssues, { desc }) => [desc(legalIssues.filingDate)],
      },
      glassdoorInsights: true,
    },
    orderBy: [desc(companyResearch.createdAt)],
  })

  return research
}

export default async function CompanyResearchPage({ params }: PageProps) {
  const { jobId } = await params
  const id = parseInt(jobId, 10)

  if (isNaN(id)) {
    notFound()
  }

  const job = await getJobWithResearch(id)

  if (!job) {
    notFound()
  }

  const research = job.company
    ? await getCompanyResearch(job.company.id)
    : null

  const hasCompany = !!job.company
  const hasResearch = !!research

  // Parse JSON fields using safe parsing
  const ethicsData = safeJsonParse(research?.ethicsAlignmentJson, null)
  const glassdoor = research?.glassdoorInsights?.[0] || null

  return (
    <div className="flex flex-col">
      <Header title="Company Research" />

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
            <h1 className="text-2xl font-bold">Company Research</h1>
            <p className="text-muted-foreground">
              {job.company
                ? `Deep research on ${job.company.name}`
                : "No company associated with this job"}
            </p>
          </div>

          <ResearchButton
            jobId={job.id}
            companyId={job.company?.id}
            hasResearch={hasResearch}
          />
        </div>

        {/* No Company Warning */}
        {!hasCompany && (
          <Card className="border-warning">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Building2 className="h-8 w-8 text-warning" />
                <div>
                  <h3 className="font-medium">Company Required</h3>
                  <p className="text-sm text-muted-foreground">
                    Please add a company name to this job application first.
                  </p>
                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="link" className="p-0 h-auto mt-1">
                      Go to job details
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Research Results */}
        {research && job.company ? (
          <div className="space-y-6">
            {/* Research Meta */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Researched{" "}
                {formatDistanceToNow(research.createdAt!, { addSuffix: true })}
              </span>
            </div>

            {/* Company Overview */}
            <CompanyOverview company={job.company} research={research} />

            {/* Leadership Team - Full Width */}
            <LeadershipTeam leaders={research.leadershipTeam || []} />

            {/* Financials & Employee Reviews Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Financials
                financials={research.financialInfo || []}
                stockSymbol={job.company.stockSymbol}
                isPublic={job.company.isPublic}
              />
              <GlassdoorInsights glassdoor={glassdoor} />
            </div>

            {/* News Feed */}
            <NewsFeed news={research.news || []} />

            {/* Legal Issues */}
            <LegalIssues issues={research.legalIssues || []} />

            {/* Ethics Alignment */}
            <EthicsAlignment ethics={ethicsData} />
          </div>
        ) : hasCompany ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Research Yet</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Click the &quot;Research Company&quot; button above to gather detailed
                information about {job.company?.name}.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
