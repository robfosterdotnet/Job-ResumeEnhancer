"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface SkillGap {
  id: number
  skill: string
  occurrenceCount: number
  percentage: number
  isLearned: boolean
}

interface SkillGapChartProps {
  initialSkillGaps: SkillGap[]
  totalJobs: number
}

export function SkillGapChart({ initialSkillGaps, totalJobs }: SkillGapChartProps) {
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>(initialSkillGaps)
  const [loading, setLoading] = useState<number | null>(null)

  const toggleLearned = useCallback(async (id: number, currentLearned: boolean) => {
    setLoading(id)
    try {
      const response = await fetch(`/api/dashboard/skill-gaps/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLearned: !currentLearned }),
      })

      if (response.ok) {
        setSkillGaps((prev) =>
          prev.map((gap) =>
            gap.id === id ? { ...gap, isLearned: !currentLearned } : gap
          )
        )
      }
    } catch (error) {
      console.error("Failed to update skill:", error)
    } finally {
      setLoading(null)
    }
  }, [])

  const getBarColor = (percentage: number, isLearned: boolean) => {
    if (isLearned) return "bg-green-500"
    if (percentage >= 60) return "bg-red-500"
    if (percentage >= 40) return "bg-orange-500"
    return "bg-yellow-500"
  }

  const unlearnedGaps = skillGaps.filter((g) => !g.isLearned)
  const learnedGaps = skillGaps.filter((g) => g.isLearned)

  if (skillGaps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Skills to Develop
          </CardTitle>
          <CardDescription>
            Aggregated from all your resume analyses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">
              Complete resume analyses to see skill recommendations
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-5 w-5" />
          Skills to Develop
        </CardTitle>
        <CardDescription>
          Skills appearing in {totalJobs} job{totalJobs !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {unlearnedGaps.slice(0, 5).map((gap) => (
          <div key={gap.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium capitalize">{gap.skill}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {gap.percentage}% of jobs
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => toggleLearned(gap.id, gap.isLearned)}
                  disabled={loading === gap.id}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Learned
                </Button>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  getBarColor(gap.percentage, gap.isLearned)
                )}
                style={{ width: `${Math.min(gap.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}

        {learnedGaps.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Learned ({learnedGaps.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {learnedGaps.map((gap) => (
                <Button
                  key={gap.id}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs bg-green-50 border-green-200 text-green-700"
                  onClick={() => toggleLearned(gap.id, gap.isLearned)}
                  disabled={loading === gap.id}
                >
                  <Check className="h-3 w-3 mr-1" />
                  {gap.skill}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
