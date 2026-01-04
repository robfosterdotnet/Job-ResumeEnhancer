"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface ScoreHistoryEntry {
  date: string
  score: number
}

interface PerformanceChartProps {
  scoreHistory: ScoreHistoryEntry[]
  className?: string
}

export function PerformanceChart({ scoreHistory, className }: PerformanceChartProps) {
  if (scoreHistory.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Score Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Complete some practice sessions to see your progress!
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculate chart dimensions
  const chartHeight = 200

  // Find min/max for Y axis (always 0-100 for scores)
  const minScore = 0
  const maxScore = 100

  // Format dates for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Calculate SVG path for the line
  const points = scoreHistory.map((entry, i) => {
    const x = (i / (scoreHistory.length - 1 || 1)) * 100
    const y = 100 - ((entry.score - minScore) / (maxScore - minScore)) * 100
    return { x, y, ...entry }
  })

  const linePath =
    points.length > 1
      ? `M ${points.map((p) => `${p.x} ${p.y}`).join(" L ")}`
      : ""

  // Calculate trend
  const avgRecent = scoreHistory.slice(-3).reduce((sum, e) => sum + e.score, 0) / Math.min(3, scoreHistory.length)
  const avgOlder = scoreHistory.slice(0, -3).reduce((sum, e) => sum + e.score, 0) / Math.max(1, scoreHistory.length - 3)
  const trend = scoreHistory.length > 3 ? avgRecent - avgOlder : 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Score Trend
          </span>
          {scoreHistory.length > 3 && (
            <span
              className={`text-sm font-normal ${
                trend >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend >= 0 ? "+" : ""}
              {trend.toFixed(1)} recent trend
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: chartHeight }} className="relative">
          <svg
            viewBox={`0 0 100 100`}
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={100 - y}
                x2="100"
                y2={100 - y}
                stroke="currentColor"
                strokeOpacity={0.1}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Area fill */}
            {points.length > 1 && (
              <path
                d={`${linePath} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`}
                fill="var(--primary)"
                fillOpacity={0.1}
              />
            )}

            {/* Line */}
            {points.length > 1 && (
              <path
                d={linePath}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Points */}
            {points.map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="var(--primary)"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground -ml-6">
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
          {scoreHistory.length <= 5
            ? scoreHistory.map((entry, i) => (
                <span key={i}>{formatDate(entry.date)}</span>
              ))
            : [
                <span key="first">{formatDate(scoreHistory[0].date)}</span>,
                <span key="last">{formatDate(scoreHistory[scoreHistory.length - 1].date)}</span>,
              ]}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold">
              {Math.round(scoreHistory.reduce((sum, e) => sum + e.score, 0) / scoreHistory.length)}
            </p>
            <p className="text-xs text-muted-foreground">Average</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {Math.max(...scoreHistory.map((e) => e.score))}
            </p>
            <p className="text-xs text-muted-foreground">Best</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{scoreHistory.length}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
