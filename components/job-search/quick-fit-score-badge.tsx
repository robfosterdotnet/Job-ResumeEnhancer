"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface QuickFitScoreBadgeProps {
  score: number | null
  isLoading?: boolean
  topMatches?: string[]
  topGaps?: string[]
  summary?: string
  onCalculate?: () => void
}

export function QuickFitScoreBadge({
  score,
  isLoading,
  topMatches = [],
  topGaps = [],
  summary,
  onCalculate,
}: QuickFitScoreBadgeProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-success text-success-foreground"
    if (score >= 60) return "bg-primary text-primary-foreground"
    if (score >= 40) return "bg-warning text-warning-foreground"
    return "bg-destructive text-destructive-foreground"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Low"
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Calculating...</span>
      </div>
    )
  }

  if (score === null) {
    if (onCalculate) {
      return (
        <button
          onClick={onCalculate}
          className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
        >
          Calculate Fit
        </button>
      )
    }
    return null
  }

  const hasDetails = topMatches.length > 0 || topGaps.length > 0 || summary

  return (
    <div className="relative">
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
          hasDetails && "cursor-pointer",
          getScoreColor(score)
        )}
        onMouseEnter={() => hasDetails && setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        <span className="font-bold">{score}%</span>
        <span className="text-xs opacity-90">{getScoreLabel(score)}</span>
      </div>

      {showDetails && hasDetails && (
        <div className="absolute top-full left-0 mt-2 z-50 min-w-[200px] max-w-xs p-3 rounded-lg bg-popover border shadow-lg">
          {summary && <p className="text-sm mb-2">{summary}</p>}
          {topMatches.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-success mb-1">Matches:</p>
              <div className="flex flex-wrap gap-1">
                {topMatches.map((match, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded bg-success/20 text-success"
                  >
                    {match}
                  </span>
                ))}
              </div>
            </div>
          )}
          {topGaps.length > 0 && (
            <div>
              <p className="text-xs font-medium text-warning mb-1">Gaps:</p>
              <div className="flex flex-wrap gap-1">
                {topGaps.map((gap, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded bg-warning/20 text-warning"
                  >
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
