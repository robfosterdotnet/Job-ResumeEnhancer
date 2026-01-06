"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface LinkedInScoreCardProps {
  title: string
  score: number
  icon: LucideIcon
  description?: string
  size?: "sm" | "md"
}

export function LinkedInScoreCard({
  title,
  score,
  icon: Icon,
  description,
  size = "md",
}: LinkedInScoreCardProps) {
  const normalizedScore = Math.min(100, Math.max(0, score))

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success"
    if (score >= 60) return "text-primary"
    if (score >= 40) return "text-warning"
    return "text-destructive"
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-success"
    if (score >= 60) return "bg-primary"
    if (score >= 40) return "bg-warning"
    return "bg-destructive"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Needs Work"
  }

  return (
    <Card className={cn(size === "sm" && "p-2")}>
      <CardHeader className={cn("pb-2", size === "sm" && "p-3 pb-1")}>
        <CardTitle
          className={cn(
            "flex items-center gap-2",
            size === "sm" ? "text-sm" : "text-base"
          )}
        >
          <Icon className={cn("h-4 w-4", getScoreColor(normalizedScore))} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(size === "sm" && "p-3 pt-0")}>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span
              className={cn(
                "font-bold",
                getScoreColor(normalizedScore),
                size === "sm" ? "text-2xl" : "text-3xl"
              )}
            >
              {normalizedScore}
            </span>
            <span
              className={cn(
                "font-medium",
                getScoreColor(normalizedScore),
                size === "sm" ? "text-xs" : "text-sm"
              )}
            >
              {getScoreLabel(normalizedScore)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                getProgressColor(normalizedScore)
              )}
              style={{ width: `${normalizedScore}%` }}
            />
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface LinkedInOverallScoreProps {
  score: number
  summary: string
}

export function LinkedInOverallScore({
  score,
  summary,
}: LinkedInOverallScoreProps) {
  const normalizedScore = Math.min(100, Math.max(0, score))

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success"
    if (score >= 60) return "text-primary"
    if (score >= 40) return "text-warning"
    return "text-destructive"
  }

  const getStrokeColor = (score: number) => {
    if (score >= 80) return "stroke-success"
    if (score >= 60) return "stroke-primary"
    if (score >= 40) return "stroke-warning"
    return "stroke-destructive"
  }

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset =
    circumference - (normalizedScore / 100) * circumference

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Circular Score Gauge */}
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-1000 ease-out",
                  getStrokeColor(normalizedScore)
                )}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={cn(
                  "text-4xl font-bold",
                  getScoreColor(normalizedScore)
                )}
              >
                {normalizedScore}
              </span>
              <span className="text-sm text-muted-foreground">Overall</span>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold">Profile Optimization Score</h3>
            <p className="text-muted-foreground">{summary}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
