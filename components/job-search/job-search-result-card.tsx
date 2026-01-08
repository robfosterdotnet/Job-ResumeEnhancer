"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QuickFitScoreBadge } from "./quick-fit-score-badge"
import { Building2, MapPin, Clock, ExternalLink, Plus, Loader2 } from "lucide-react"

export interface JobSearchResult {
  id: string
  title: string
  company: string | null
  location: string | null
  snippet: string
  url: string
  source: string | null
  postedDate: string | null
}

export interface QuickFitData {
  fitScore: number
  summary: string
  topMatches: string[]
  topGaps: string[]
}

interface JobSearchResultCardProps {
  job: JobSearchResult
  resumeId: number | null
  quickFit: QuickFitData | null
  isCalculating?: boolean
  isAdding?: boolean
  onCalculateFit: () => void
  onAddJob: () => void
}

export function JobSearchResultCard({
  job,
  resumeId,
  quickFit,
  isCalculating,
  isAdding,
  onCalculateFit,
  onAddJob,
}: JobSearchResultCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header: Title and Score */}
            <div className="flex items-start gap-3 mb-2">
              <QuickFitScoreBadge
                score={quickFit?.fitScore ?? null}
                isLoading={isCalculating}
                topMatches={quickFit?.topMatches}
                topGaps={quickFit?.topGaps}
                summary={quickFit?.summary}
                onCalculate={resumeId ? onCalculateFit : undefined}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg leading-tight truncate">
                  {job.title}
                </h3>
              </div>
              {job.source && (
                <Badge variant="secondary" className="shrink-0">
                  {job.source}
                </Badge>
              )}
            </div>

            {/* Meta info: Company, Location, Posted */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
              {job.company && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>{job.company}</span>
                </div>
              )}
              {job.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
              )}
              {job.postedDate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{job.postedDate}</span>
                </div>
              )}
            </div>

            {/* Snippet */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {job.snippet}
            </p>

            {/* Quick fit matches/gaps preview */}
            {quickFit && (
              <div className="flex flex-wrap gap-2 mb-3">
                {quickFit.topMatches.slice(0, 3).map((match, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-success/10 text-success"
                  >
                    ✓ {match}
                  </span>
                ))}
                {quickFit.topGaps.slice(0, 2).map((gap, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-warning/10 text-warning"
                  >
                    ⚠ {gap}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Posting
                </a>
              </Button>
              <Button
                size="sm"
                onClick={onAddJob}
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add to Applications
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
