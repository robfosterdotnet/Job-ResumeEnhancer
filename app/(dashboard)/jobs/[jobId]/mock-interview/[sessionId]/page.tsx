"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { use } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { InterviewSession } from "@/components/mock-interview"
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react"

type PageProps = {
  params: Promise<{ jobId: string; sessionId: string }>
}

interface SessionData {
  id: number
  jobApplicationId: number
  feedbackMode: "immediate" | "summary"
  voiceEnabled: boolean
  status: "setup" | "in_progress" | "completed" | "abandoned"
}

export default function MockInterviewSessionPage({ params }: PageProps) {
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

        // If session is already completed, redirect to review
        if (data.session.status === "completed") {
          router.replace(`/jobs/${jobIdNum}/mock-interview/${sessionIdNum}/review`)
          return
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session")
      } finally {
        setIsLoading(false)
      }
    }

    if (!isNaN(sessionIdNum)) {
      fetchSession()
    }
  }, [sessionIdNum, jobIdNum, router])

  const handleSessionEnd = () => {
    router.push(`/jobs/${jobIdNum}/mock-interview`)
  }

  if (isNaN(jobIdNum) || isNaN(sessionIdNum)) {
    return (
      <div className="flex flex-col">
        <Header title="Mock Interview" />
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

  return (
    <div className="flex flex-col">
      <Header title="Mock Interview" />

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
          <InterviewSession
            sessionId={session.id}
            jobApplicationId={session.jobApplicationId}
            feedbackMode={session.feedbackMode}
            voiceEnabled={session.voiceEnabled || false}
            onSessionEnd={handleSessionEnd}
          />
        ) : null}
      </div>
    </div>
  )
}
