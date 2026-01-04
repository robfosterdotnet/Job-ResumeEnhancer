"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Lightbulb, Target } from "lucide-react"

interface StarAnalysis {
  situation: boolean
  task: boolean
  action: boolean
  result: boolean
}

interface FeedbackDisplayProps {
  score: number
  feedback: string
  suggestedImprovement: string
  keyPointsCovered: string[]
  keyPointsMissed: string[]
  starAnalysis?: StarAnalysis
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400"
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
  if (score >= 40) return "text-orange-600 dark:text-orange-400"
  return "text-red-600 dark:text-red-400"
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent"
  if (score >= 60) return "Good"
  if (score >= 40) return "Average"
  return "Needs Improvement"
}

export function FeedbackDisplay({
  score,
  feedback,
  suggestedImprovement,
  keyPointsCovered,
  keyPointsMissed,
  starAnalysis,
}: FeedbackDisplayProps) {
  const scoreColor = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)

  return (
    <Card className="border-t-4 border-t-primary">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Feedback</span>
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
            <Badge variant="outline" className={scoreColor}>
              {scoreLabel}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Progress */}
        <div>
          <Progress value={score} className="h-3" />
        </div>

        {/* Main Feedback */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm leading-relaxed">{feedback}</p>
        </div>

        {/* STAR Analysis */}
        {starAnalysis && (
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              STAR Method Analysis
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {(["situation", "task", "action", "result"] as const).map((item) => (
                <div
                  key={item}
                  className={`p-2 rounded text-center text-xs font-medium ${
                    starAnalysis[item]
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Points */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Points Covered */}
          {keyPointsCovered.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                Points Covered
              </h4>
              <ul className="space-y-1">
                {keyPointsCovered.map((point, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">+</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Points Missed */}
          {keyPointsMissed.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="h-4 w-4" />
                Could Improve
              </h4>
              <ul className="space-y-1">
                {keyPointsMissed.map((point, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 mt-0.5">-</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Suggested Improvement */}
        <div className="p-4 bg-accent rounded-lg">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Suggestion for Improvement
          </h4>
          <p className="text-sm text-muted-foreground">{suggestedImprovement}</p>
        </div>
      </CardContent>
    </Card>
  )
}
