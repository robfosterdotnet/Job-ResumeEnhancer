"use client"

import { JobSearchResultCard, JobSearchResult, QuickFitData } from "./job-search-result-card"
import { SearchX } from "lucide-react"

interface JobSearchResultsProps {
  results: JobSearchResult[]
  query: string
  resumeId: number | null
  quickFits: Record<string, QuickFitData | null>
  calculatingIds: Set<string>
  addingIds: Set<string>
  onCalculateFit: (job: JobSearchResult) => void
  onAddJob: (job: JobSearchResult) => void
}

export function JobSearchResults({
  results,
  query,
  resumeId,
  quickFits,
  calculatingIds,
  addingIds,
  onCalculateFit,
  onAddJob,
}: JobSearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-1">No jobs found</h3>
        <p className="text-muted-foreground max-w-md">
          No job listings found for &ldquo;{query}&rdquo;. Try different keywords or a broader search.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Found {results.length} job{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
      </p>
      <div className="grid gap-4">
        {results.map((job) => (
          <JobSearchResultCard
            key={job.id}
            job={job}
            resumeId={resumeId}
            quickFit={quickFits[job.id] ?? null}
            isCalculating={calculatingIds.has(job.id)}
            isAdding={addingIds.has(job.id)}
            onCalculateFit={() => onCalculateFit(job)}
            onAddJob={() => onAddJob(job)}
          />
        ))}
      </div>
    </div>
  )
}
