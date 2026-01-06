"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { use } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  InterviewSetupDialog,
  SessionHistory,
  PerformanceDashboard,
  PerformanceChart,
  type InterviewConfig,
} from "@/components/mock-interview"
import { ArrowLeft, Play, MessageSquare, RefreshCw, AlertCircle } from "lucide-react"
import { safeJsonParse } from "@/lib/utils/safe-json"

type PageProps = { params: Promise<{ jobId: string }> }

interface Session {
  id: number
  status: "setup" | "in_progress" | "completed" | "abandoned"
  feedbackMode: "immediate" | "summary"
  questionCount: number | null
  overallScore: number | null
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date | null
}

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
  scoreHistoryJson: string | null
}

interface Interviewer {
  id: number
  name: string
  role?: string | null
  interviewRole?: string | null
  expertiseAreasJson?: string | null
  likelyInterviewFocus?: string | null
  analysisStatus: string
}

export default function MockInterviewPage({ params }: PageProps) {
  const { jobId } = use(params)
  const router = useRouter()
  const id = parseInt(jobId, 10)

  const [isSetupOpen, setIsSetupOpen] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAnalysis, setHasAnalysis] = useState(false)
  const [analysisId, setAnalysisId] = useState<number | null>(null)
  const [interviewers, setInterviewers] = useState<Interviewer[]>([])

  // Fetch sessions and check for analysis
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch sessions
        const sessionsRes = await fetch(`/api/mock-interview/sessions?jobApplicationId=${id}`)
        if (!sessionsRes.ok) throw new Error("Failed to load sessions")
        const sessionsData = await sessionsRes.json()
        setSessions(sessionsData.sessions || [])
        setMetrics(sessionsData.metrics || null)

        // Check for resume analysis
        const jobRes = await fetch(`/api/jobs/${id}`)
        if (jobRes.ok) {
          const jobData = await jobRes.json()
          const job = jobData.job
          // Check if there's an analysis with questions
          if (job.analyses && job.analyses.length > 0) {
            const latestAnalysis = job.analyses[0]
            if (latestAnalysis.interviewQuestions?.length > 0) {
              setHasAnalysis(true)
              setAnalysisId(latestAnalysis.id)
            }
          }
        }

        // Fetch interviewers
        const interviewersRes = await fetch(`/api/interviewers?jobId=${id}`)
        if (interviewersRes.ok) {
          const interviewersData = await interviewersRes.json()
          setInterviewers(interviewersData.interviewers || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    if (!isNaN(id)) {
      fetchData()
    }
  }, [id])

  // Start a new interview session
  const handleStartInterview = async (config: InterviewConfig) => {
    try {
      const response = await fetch("/api/mock-interview/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobApplicationId: id,
          resumeAnalysisId: analysisId,
          feedbackMode: config.feedbackMode,
          questionCount: config.questionCount,
          selectedCategories: config.selectedCategories.length > 0 ? config.selectedCategories : null,
          difficulty: config.difficulty,
          voiceEnabled: config.voiceEnabled,
          selectedInterviewerIds: config.selectedInterviewerIds.length > 0 ? config.selectedInterviewerIds : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create session")
      }

      const data = await response.json()
      router.push(`/jobs/${id}/mock-interview/${data.session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start interview")
    }
  }

  // Navigate to a session
  const handleSelectSession = (sessionId: number) => {
    const session = sessions.find((s) => s.id === sessionId)
    if (session?.status === "completed") {
      router.push(`/jobs/${id}/mock-interview/${sessionId}/review`)
    } else {
      router.push(`/jobs/${id}/mock-interview/${sessionId}`)
    }
  }

  // Delete a session
  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm("Are you sure you want to delete this session?")) return

    try {
      const response = await fetch(`/api/mock-interview/sessions/${sessionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete session")
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete session")
    }
  }

  // Parse score history from metrics using safe parsing
  const scoreHistory = safeJsonParse(metrics?.scoreHistoryJson, [])

  if (isNaN(id)) {
    return (
      <div className="flex flex-col">
        <Header title="Mock Interview" />
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
              <p>Invalid job ID</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="Mock Interview" />

      <div className="p-6 space-y-6">
        {/* Back Link */}
        <Link
          href={`/jobs/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to job details
        </Link>

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Mock Interview Practice
            </h1>
            <p className="text-muted-foreground">
              Practice answering interview questions and get AI-powered feedback
            </p>
          </div>

          <Button
            onClick={() => setIsSetupOpen(true)}
            disabled={!hasAnalysis}
          >
            <Play className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>

        {/* No Analysis Warning */}
        {!isLoading && !hasAnalysis && (
          <Card className="border-warning">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <RefreshCw className="h-8 w-8 text-warning" />
                <div>
                  <h3 className="font-medium">Resume Analysis Required</h3>
                  <p className="text-sm text-muted-foreground">
                    Please run a resume analysis first to generate interview questions.
                  </p>
                  <Link href={`/jobs/${id}/resume-analysis`}>
                    <Button variant="link" className="p-0 h-auto mt-1">
                      Go to Resume Analysis
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="p-4">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="p-6 flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Dashboard Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Performance Dashboard */}
              <PerformanceDashboard metrics={metrics} />

              {/* Score Trend Chart */}
              <PerformanceChart scoreHistory={scoreHistory} />
            </div>

            {/* Session History */}
            <SessionHistory
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
            />
          </>
        )}
      </div>

      {/* Setup Dialog */}
      <InterviewSetupDialog
        open={isSetupOpen}
        onOpenChange={setIsSetupOpen}
        onStart={handleStartInterview}
        interviewers={interviewers}
      />
    </div>
  )
}
