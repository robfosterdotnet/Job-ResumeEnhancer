"use client"

import { cn } from "@/lib/utils"

interface FitScoreGaugeProps {
  score: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function FitScoreGauge({ score, size = "md", showLabel = true }: FitScoreGaugeProps) {
  const normalizedScore = Math.min(100, Math.max(0, score))

  const sizeClasses = {
    sm: { container: "w-24 h-24", text: "text-xl", label: "text-xs" },
    md: { container: "w-32 h-32", text: "text-3xl", label: "text-sm" },
    lg: { container: "w-48 h-48", text: "text-5xl", label: "text-base" },
  }

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
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference

  return (
    <div className={cn("relative", sizeClasses[size].container)}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
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
          className={cn("transition-all duration-1000 ease-out", getStrokeColor(normalizedScore))}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold", sizeClasses[size].text, getScoreColor(normalizedScore))}>
          {normalizedScore}%
        </span>
        {showLabel && (
          <span className={cn("text-muted-foreground", sizeClasses[size].label)}>
            Fit Score
          </span>
        )}
      </div>
    </div>
  )
}
