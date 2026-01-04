"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { use } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Play,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
} from "lucide-react"
import { safeJsonParse } from "@/lib/utils/safe-json"

type PageProps = {
  params: Promise<{ jobId: string; sessionId: string }>
}

interface Response {
  id: number
  questionText: string
  questionCategory: string | null
  questionDifficulty: string | null
  isFollowUp: boolean | null
  userAnswer: string | null
  score: number | null
  feedback: string | null
  suggestedImprovement: string | null
  keyPointsCoveredJson: string | null
  keyPointsMissedJson: string | null
}

interface SessionData {
  id: number
  jobApplicationId: number
  feedbackMode: "immediate" | "summary"
  status: "setup" | "in_progress" | "completed" | "abandoned"
  overallScore: number | null
  summaryFeedback: string | null
  strengthAreasJson: string | null
  improvementAreasJson: string | null
  startedAt: Date | null
  completedAt: Date | null
  responses: Response[]
}

const categoryLabels: Record<string, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  situational: "Situational",
  "company-specific": "Company",
  "role-specific": "Role",
  "follow-up": "Follow-up",
}

function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground"
  if (score >= 80) return "text-green-600 dark:text-green-400"
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
  if (score >= 40) return "text-orange-600 dark:text-orange-400"
  return "text-red-600 dark:text-red-400"
}

function formatDuration(start: Date | null, end: Date | null): string {
  if (!start || !end) return "-"
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "<1 min"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

export default function MockInterviewReviewPage({ params }: PageProps) {
  const { jobId, sessionId } = use(params)
  const router = useRouter()
  const jobIdNum = parseInt(jobId, 10)
  const sessionIdNum = parseInt(sessionId, 10)

  const [session, setSession] = useState<SessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/mock-interview/sessions/${sessionIdNum}`)
        if (!response.ok) {
          throw new Error("Failed to load session")
        }

        const data = await response.json()
        setSession(data.session)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session")
      } finally {
        setIsLoading(false)
      }
    }

    if (!isNaN(sessionIdNum)) {
      fetchSession()
    }
  }, [sessionIdNum])

  const handleStartNewSession = () => {
    router.push(`/jobs/${jobIdNum}/mock-interview`)
  }

  if (isNaN(jobIdNum) || isNaN(sessionIdNum)) {
    return (
      <div className="flex flex-col">
        <Header title="Session Review" />
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
              <p>Invalid session ID</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Parse JSON fields using safe parsing
  const strengthAreas = safeJsonParse<string[]>(session?.strengthAreasJson, [])
  const improvementAreas = safeJsonParse<string[]>(session?.improvementAreasJson, [])

  const answeredResponses =
    session?.responses.filter((r) => r.userAnswer && r.userAnswer !== "[SKIPPED]") || []

  return (
    <div className="flex flex-col">
      <Header title="Session Review" />

      <div className="p-6 space-y-6">
        {/* Back Link */}
        <Link
          href={`/jobs/${jobIdNum}/mock-interview`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Mock Interview
        </Link>

        {/* Loading State */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6 flex items-center justify-center min-h-[400px]">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : session ? (
          <div className="space-y-6">
            {/* Overall Summary Card */}
            <Card className="border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Session Summary
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-4xl font-bold ${getScoreColor(session.overallScore)}`}>
                      {session.overallScore ?? "-"}
                    </span>
                    <span className="text-xl text-muted-foreground">/100</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Duration */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Duration: {formatDuration(session.startedAt, session.completedAt)}
                </div>

                {/* Summary Feedback */}
                {session.summaryFeedback && (
                  <p className="text-muted-foreground">{session.summaryFeedback}</p>
                )}

                {/* Strengths & Improvements */}
                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  {strengthAreas.length > 0 && (
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <h4 className="font-medium text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Strengths
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {strengthAreas.map((strength: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-600">+</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {improvementAreas.length > 0 && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <h4 className="font-medium text-orange-700 dark:text-orange-300 mb-2 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Areas to Improve
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {improvementAreas.map((area: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-orange-600">!</span>
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="flex justify-center pt-4">
                  <Button onClick={handleStartNewSession}>
                    <Play className="h-4 w-4 mr-2" />
                    Practice Again
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Individual Responses */}
            <Card>
              <CardHeader>
                <CardTitle>Question-by-Question Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {answeredResponses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No answers recorded in this session.
                  </p>
                ) : (
                  answeredResponses.map((response, index) => {
                    const keyPointsCovered = safeJsonParse<string[]>(response.keyPointsCoveredJson, [])
                    const keyPointsMissed = safeJsonParse<string[]>(response.keyPointsMissedJson, [])

                    return (
                      <div key={response.id} className="border rounded-lg p-4 space-y-4">
                        {/* Question Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">Q{index + 1}</Badge>
                              {response.questionCategory && (
                                <Badge variant="secondary">
                                  {categoryLabels[response.questionCategory] || response.questionCategory}
                                </Badge>
                              )}
                              {response.questionDifficulty && (
                                <Badge
                                  className={
                                    response.questionDifficulty === "easy"
                                      ? "bg-green-100 text-green-800"
                                      : response.questionDifficulty === "hard"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {response.questionDifficulty}
                                </Badge>
                              )}
                              {response.isFollowUp && (
                                <Badge variant="outline" className="border-primary text-primary">
                                  Follow-up
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium">{response.questionText}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-2xl font-bold ${getScoreColor(response.score)}`}>
                              {response.score ?? "-"}
                            </span>
                            <span className="text-sm text-muted-foreground">/100</span>
                          </div>
                        </div>

                        {/* Score Progress */}
                        {response.score !== null && (
                          <Progress value={response.score} className="h-2" />
                        )}

                        {/* User Answer */}
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Your Answer:</p>
                          <p className="text-sm">{response.userAnswer}</p>
                        </div>

                        {/* Feedback */}
                        {response.feedback && (
                          <div>
                            <p className="text-sm font-medium mb-1">Feedback:</p>
                            <p className="text-sm text-muted-foreground">{response.feedback}</p>
                          </div>
                        )}

                        {/* Key Points */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {keyPointsCovered.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-green-600 mb-1">
                                Points Covered:
                              </p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {keyPointsCovered.map((point: string, i: number) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-green-600">+</span> {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {keyPointsMissed.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-orange-600 mb-1">
                                Could Improve:
                              </p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {keyPointsMissed.map((point: string, i: number) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-orange-600">-</span> {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Suggestion */}
                        {response.suggestedImprovement && (
                          <div className="bg-accent p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">Suggestion:</p>
                            <p className="text-sm text-muted-foreground">
                              {response.suggestedImprovement}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}
