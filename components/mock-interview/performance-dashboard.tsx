"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Target, TrendingUp, TrendingDown } from "lucide-react"

interface Metrics {
  totalSessions: number | null
  completedSessions: number | null
  averageScore: number | null
  behavioralAvgScore: number | null
  technicalAvgScore: number | null
  situationalAvgScore: number | null
  companySpecificAvgScore: number | null
  roleSpecificAvgScore: number | null
  strongestCategory: string | null
  weakestCategory: string | null
}

interface PerformanceDashboardProps {
  metrics: Metrics | null
  className?: string
}

const categoryLabels: Record<string, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  situational: "Situational",
  "company-specific": "Company",
  "role-specific": "Role",
}

function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground"
  if (score >= 80) return "text-green-600 dark:text-green-400"
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
  if (score >= 40) return "text-orange-600 dark:text-orange-400"
  return "text-red-600 dark:text-red-400"
}

export function PerformanceDashboard({ metrics, className }: PerformanceDashboardProps) {
  if (!metrics || (metrics.totalSessions || 0) === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Complete some practice sessions to see your performance metrics!
          </p>
        </CardContent>
      </Card>
    )
  }

  const categoryScores = [
    { key: "behavioral", label: "Behavioral", score: metrics.behavioralAvgScore },
    { key: "technical", label: "Technical", score: metrics.technicalAvgScore },
    { key: "situational", label: "Situational", score: metrics.situationalAvgScore },
    { key: "company-specific", label: "Company", score: metrics.companySpecificAvgScore },
    { key: "role-specific", label: "Role", score: metrics.roleSpecificAvgScore },
  ].filter((c) => c.score !== null) as Array<{ key: string; label: string; score: number }>

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-3xl font-bold">{metrics.completedSessions || 0}</p>
            <p className="text-sm text-muted-foreground">Sessions</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className={`text-3xl font-bold ${getScoreColor(metrics.averageScore)}`}>
              {metrics.averageScore !== null ? Math.round(metrics.averageScore) : "-"}
            </p>
            <p className="text-sm text-muted-foreground">Avg Score</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-3xl font-bold">
              {metrics.totalSessions ? Math.round(((metrics.completedSessions || 0) / metrics.totalSessions) * 100) : 0}%
            </p>
            <p className="text-sm text-muted-foreground">Completion</p>
          </div>
        </div>

        {/* Strongest & Weakest */}
        {(metrics.strongestCategory || metrics.weakestCategory) && (
          <div className="grid grid-cols-2 gap-4">
            {metrics.strongestCategory && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Strongest
                  </span>
                </div>
                <p className="font-medium">
                  {categoryLabels[metrics.strongestCategory] || metrics.strongestCategory}
                </p>
              </div>
            )}
            {metrics.weakestCategory && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    Focus Area
                  </span>
                </div>
                <p className="font-medium">
                  {categoryLabels[metrics.weakestCategory] || metrics.weakestCategory}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Category Breakdown */}
        {categoryScores.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Category Scores
            </h4>
            <div className="space-y-3">
              {categoryScores.map((cat) => (
                <div key={cat.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{cat.label}</span>
                    <span className={getScoreColor(cat.score)}>{Math.round(cat.score)}%</span>
                  </div>
                  <Progress value={cat.score} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
