"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Scale, AlertTriangle, CheckCircle, Clock, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface LegalIssue {
  id: number
  title: string
  description?: string | null
  caseType?: string | null
  status?: "pending" | "resolved" | "ongoing" | "settled" | "dismissed" | null
  filingDate?: Date | null
  resolution?: string | null
  sourceUrl?: string | null
}

interface LegalIssuesProps {
  issues: LegalIssue[]
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/10",
    label: "Pending",
  },
  resolved: {
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/10",
    label: "Resolved",
  },
  ongoing: {
    icon: AlertTriangle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    label: "Ongoing",
  },
  settled: {
    icon: CheckCircle,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    label: "Settled",
  },
  dismissed: {
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/10",
    label: "Dismissed",
  },
}

export function LegalIssues({ issues }: LegalIssuesProps) {
  // Count active issues
  const activeIssues = issues.filter(
    (i) => i.status === "pending" || i.status === "ongoing"
  ).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Legal & Regulatory Issues
            </CardTitle>
            <CardDescription>Lawsuits, regulatory actions, and controversies</CardDescription>
          </div>
          {issues.length > 0 && (
            <Badge
              variant={activeIssues > 0 ? "destructive" : "secondary"}
              className="text-xs"
            >
              {activeIssues > 0 ? `${activeIssues} Active` : "No Active Issues"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg">
            <CheckCircle className="h-5 w-5 text-success" />
            <div>
              <p className="font-medium text-success">No Known Legal Issues</p>
              <p className="text-sm text-muted-foreground">
                No significant legal or regulatory issues have been identified.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            {activeIssues > 0 && (
              <div className="flex items-center gap-3 p-4 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-warning">
                    {activeIssues} Active Legal Matter{activeIssues > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Review the details below carefully.
                  </p>
                </div>
              </div>
            )}

            {/* Issues List */}
            <div className="space-y-3">
              {issues.map((issue) => {
                const config = issue.status ? statusConfig[issue.status] : null

                return (
                  <div
                    key={issue.id}
                    className={cn(
                      "border rounded-lg p-4",
                      issue.status === "ongoing" || issue.status === "pending"
                        ? "border-warning"
                        : ""
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {config && (
                            <Badge
                              variant="secondary"
                              className={cn("text-xs gap-1", config.bgColor, config.color)}
                            >
                              {(() => {
                                const Icon = config.icon
                                return <Icon className="h-3 w-3" />
                              })()}
                              {config.label}
                            </Badge>
                          )}
                          {issue.caseType && (
                            <Badge variant="secondary" className="text-xs">
                              {issue.caseType}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium">{issue.title}</h4>
                        {issue.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {issue.description}
                          </p>
                        )}
                        {issue.resolution && (
                          <p className="text-sm text-success mt-2">
                            <span className="font-medium">Resolution:</span>{" "}
                            {issue.resolution}
                          </p>
                        )}
                        {issue.filingDate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Filed{" "}
                            {formatDistanceToNow(new Date(issue.filingDate), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                      </div>
                      {issue.sourceUrl && (
                        <a
                          href={issue.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
