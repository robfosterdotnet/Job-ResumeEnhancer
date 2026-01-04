import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { jobApplications } from "@/lib/db/schema"
import { desc, eq, count } from "drizzle-orm"
import Link from "next/link"
import { Plus, Briefcase, CheckCircle, Clock, TrendingUp } from "lucide-react"

async function getStats() {
  const total = await db.select({ count: count() }).from(jobApplications)
  const analyzed = await db.select({ count: count() }).from(jobApplications).where(eq(jobApplications.status, "analyzed"))
  const applied = await db.select({ count: count() }).from(jobApplications).where(eq(jobApplications.status, "applied"))
  const interviewing = await db.select({ count: count() }).from(jobApplications).where(eq(jobApplications.status, "interviewing"))

  return {
    total: total[0].count,
    analyzed: analyzed[0].count,
    applied: applied[0].count,
    interviewing: interviewing[0].count,
  }
}

async function getRecentJobs() {
  return db.query.jobApplications.findMany({
    with: {
      company: true,
    },
    orderBy: [desc(jobApplications.createdAt)],
    limit: 5,
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

export default async function DashboardPage() {
  const stats = await getStats()
  const recentJobs = await getRecentJobs()

  return (
    <div className="flex flex-col">
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Analyzed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.analyzed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Applied</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.applied}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Interviewing</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.interviewing}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your job search</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Link href="/jobs/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Job Application
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline">
                View All Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Your latest job applications</CardDescription>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No job applications yet</p>
                <Link href="/jobs/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Job
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div>
                      <h3 className="font-medium">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {job.company?.name || "No company"}
                      </p>
                    </div>
                    <Badge variant={statusColors[job.status || "saved"]}>
                      {job.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
