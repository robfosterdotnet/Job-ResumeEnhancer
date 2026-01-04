import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { jobApplications } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import Link from "next/link"
import { Plus, Building2, Calendar, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

async function getJobs() {
  return db.query.jobApplications.findMany({
    with: {
      company: true,
      resume: true,
      analyses: true,
    },
    orderBy: [desc(jobApplications.createdAt)],
  })
}

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

export default async function JobsPage() {
  const jobs = await getJobs()

  return (
    <div className="flex flex-col">
      <Header title="Job Applications" />

      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {jobs.length} job application{jobs.length !== 1 ? "s" : ""}
          </p>
          <Link href="/jobs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Job Application
            </Button>
          </Link>
        </div>

        {/* Job List */}
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No job applications yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your job search by adding your first application
              </p>
              <Link href="/jobs/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Job Application
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-lg font-semibold hover:text-primary transition-colors"
                        >
                          {job.title}
                        </Link>
                        <Badge variant={statusColors[job.status || "saved"]}>
                          {job.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {job.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.company.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(job.createdAt!, { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.jobDescriptionUrl && (
                        <a
                          href={job.jobDescriptionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm">
                    <span className={job.resume ? "text-success" : "text-muted-foreground"}>
                      Resume: {job.resume ? "Uploaded" : "Not uploaded"}
                    </span>
                    <span className={job.analyses && job.analyses.length > 0 ? "text-success" : "text-muted-foreground"}>
                      Analysis: {job.analyses && job.analyses.length > 0 ? "Complete" : "Pending"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
