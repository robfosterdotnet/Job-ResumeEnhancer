"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Award,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  RotateCcw,
  FileText,
  ArrowRight,
} from "lucide-react"

interface SessionSummaryProps {
  overallScore: number
  summaryFeedback: string
  strengthAreas: string[]
  improvementAreas: string[]
  categoryScores: Record<string, number | null>
  recommendations: string[]
  onStartNewSession?: () => void
  onViewDetails?: () => void
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
  return "Needs Work"
}

function getProgressColor(score: number): string {
  if (score >= 80) return "bg-green-500"
  if (score >= 60) return "bg-yellow-500"
  if (score >= 40) return "bg-orange-500"
  return "bg-red-500"
}

const categoryLabels: Record<string, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  situational: "Situational",
  companySpecific: "Company-Specific",
  roleSpecific: "Role-Specific",
}

export function SessionSummary({
  overallScore,
  summaryFeedback,
  strengthAreas,
  improvementAreas,
  categoryScores,
  recommendations,
  onStartNewSession,
  onViewDetails,
}: SessionSummaryProps) {
  const scoreColor = getScoreColor(overallScore)
  const scoreLabel = getScoreLabel(overallScore)

  // Filter out null category scores
  const validCategoryScores = Object.entries(categoryScores).filter(
    ([, score]) => score !== null
  ) as [string, number][]

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
          <CardTitle className="flex items-center justify-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Interview Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div>
            <span className={`text-6xl font-bold ${scoreColor}`}>
              {overallScore}
            </span>
            <span className="text-2xl text-muted-foreground">/100</span>
          </div>
          <Badge className={`text-lg px-4 py-1 ${getProgressColor(overallScore)} text-white`}>
            {scoreLabel}
          </Badge>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {summaryFeedback}
          </p>
        </CardContent>
      </Card>

      {/* Category Scores */}
      {validCategoryScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {validCategoryScores.map(([category, score]) => (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{categoryLabels[category] || category}</span>
                    <span className={getScoreColor(score)}>{score}%</span>
                  </div>
                  <Progress
                    value={score}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        {strengthAreas.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <TrendingUp className="h-5 w-5" />
                Your Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {strengthAreas.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 dark:text-green-400 font-bold">+</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Areas for Improvement */}
        {improvementAreas.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <TrendingDown className="h-5 w-5" />
                Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {improvementAreas.map((area, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-600 dark:text-orange-400 font-bold">!</span>
                    {area}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Practice Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {onStartNewSession && (
          <Button onClick={onStartNewSession}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Practice Again
          </Button>
        )}
        {onViewDetails && (
          <Button variant="outline" onClick={onViewDetails}>
            <FileText className="h-4 w-4 mr-2" />
            View Detailed Review
          </Button>
        )}
      </div>
    </div>
  )
}
