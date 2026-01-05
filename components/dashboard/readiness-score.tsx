"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface CategoryScore {
  category: string
  score: number | null
}

interface ReadinessScoreProps {
  overallScore: number
  categories: CategoryScore[]
  weakestCategory?: string
  totalSessions: number
}

export function ReadinessScore({
  overallScore,
  categories,
  weakestCategory,
  totalSessions,
}: ReadinessScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (totalSessions === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mic className="h-5 w-5" />
            Interview Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm mb-4">
              Complete a mock interview to see your readiness score
            </p>
            <Link href="/jobs">
              <Button size="sm">
                <Mic className="h-4 w-4 mr-2" />
                Start Practice
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mic className="h-5 w-5" />
          Interview Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="text-center">
          <div className={cn("text-4xl font-bold", getScoreColor(overallScore))}>
            {overallScore}
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Based on {totalSessions} practice session{totalSessions !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-2">
          {categories.map((cat) => {
            const score = cat.score ?? 0
            const isWeak = cat.category.toLowerCase() === weakestCategory?.toLowerCase()
            return (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    {isWeak ? (
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                    ) : score >= 70 ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : null}
                    <span className="capitalize">{cat.category}</span>
                  </span>
                  <span className={cn("font-medium", getScoreColor(score))}>
                    {score}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      getProgressColor(score)
                    )}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Practice CTA */}
        {weakestCategory && (
          <Link href="/jobs">
            <Button variant="outline" size="sm" className="w-full">
              Practice {weakestCategory} Questions
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
