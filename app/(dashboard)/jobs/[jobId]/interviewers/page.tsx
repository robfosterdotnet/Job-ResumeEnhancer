"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { AddInterviewerForm } from "@/components/interviewers/add-interviewer-form"
import { InterviewerList } from "@/components/interviewers/interviewer-list"
import { InterviewerData } from "@/components/interviewers/interviewer-card"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { consumeSSEStream } from "@/lib/utils/sse"

export default function InterviewersPage() {
  const params = useParams()
  const jobId = parseInt(params.jobId as string, 10)

  const [interviewers, setInterviewers] = useState<InterviewerData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [refreshingId, setRefreshingId] = useState<number | null>(null)
  const [progress, setProgress] = useState({ message: "", percentage: 0 })
  const [error, setError] = useState<string | null>(null)

  // Fetch interviewers
  const fetchInterviewers = useCallback(async () => {
    try {
      const response = await fetch(`/api/interviewers?jobId=${jobId}`, {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ""}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setInterviewers(data.interviewers)
      }
    } catch (err) {
      console.error("Error fetching interviewers:", err)
    } finally {
      setIsLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    fetchInterviewers()
  }, [fetchInterviewers])

  // Add interviewer
  const handleAddInterviewer = async (data: {
    name: string
    role: string
    interviewRole: string
    linkedInUrl: string
    linkedInContent: string
  }) => {
    setIsAdding(true)
    setError(null)
    setProgress({ message: "Adding interviewer...", percentage: 10 })

    try {
      const response = await fetch("/api/interviewers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ""}`,
        },
        body: JSON.stringify({
          jobApplicationId: jobId,
          name: data.name,
          role: data.role || undefined,
          interviewRole: data.interviewRole || undefined,
          linkedInUrl: data.linkedInUrl || undefined,
          linkedInContent: data.linkedInContent || undefined,
        }),
      })

      // Check if it's a streaming response
      const contentType = response.headers.get("content-type")
      if (contentType?.includes("text/event-stream")) {
        // Handle SSE stream
        await consumeSSEStream(response, {
          onEvent: (event) => {
            if (event.type === "progress") {
              setProgress({
                message: (event.message as string) || "Analyzing...",
                percentage: (event.percentage as number) || 50,
              })
            } else if (event.type === "complete") {
              setInterviewers((prev) => [event.interviewer as InterviewerData, ...prev])
              setProgress({ message: "Complete!", percentage: 100 })
            } else if (event.type === "error") {
              setError((event.error as string) || "Analysis failed")
            }
          },
        })
      } else {
        // Regular JSON response (no LinkedIn content provided)
        const result = await response.json()
        if (result.interviewer) {
          setInterviewers((prev) => [result.interviewer, ...prev])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add interviewer")
    } finally {
      setIsAdding(false)
      setProgress({ message: "", percentage: 0 })
    }
  }

  // Delete interviewer
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/interviewers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ""}`,
        },
      })
      if (response.ok) {
        setInterviewers((prev) => prev.filter((i) => i.id !== id))
      }
    } catch (err) {
      console.error("Error deleting interviewer:", err)
    }
  }

  // Refresh/re-analyze interviewer
  const handleRefresh = async (id: number) => {
    const interviewer = interviewers.find((i) => i.id === id)
    if (!interviewer?.rawLinkedInContent) return

    setRefreshingId(id)

    try {
      const response = await fetch(`/api/interviewers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ""}`,
        },
        body: JSON.stringify({
          linkedInContent: interviewer.rawLinkedInContent,
          reanalyze: true,
        }),
      })

      const contentType = response.headers.get("content-type")
      if (contentType?.includes("text/event-stream")) {
        await consumeSSEStream(response, {
          onEvent: (event) => {
            if (event.type === "complete") {
              setInterviewers((prev) =>
                prev.map((i) => (i.id === id ? (event.interviewer as InterviewerData) : i))
              )
            }
          },
        })
      }
    } catch (err) {
      console.error("Error refreshing interviewer:", err)
    } finally {
      setRefreshingId(null)
    }
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/jobs/${jobId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Interview Panel
          </h1>
          <p className="text-muted-foreground">
            Add interviewers to prepare for your conversations
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      {isAdding && progress.percentage > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{progress.message}</span>
                <span>{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Add form */}
      <AddInterviewerForm onSubmit={handleAddInterviewer} isLoading={isAdding} />

      {/* Interviewers list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Your Interviewers ({interviewers.length})
        </h2>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading interviewers...
          </div>
        ) : (
          <InterviewerList
            interviewers={interviewers}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
            refreshingId={refreshingId}
          />
        )}
      </div>
    </div>
  )
}
