"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Loader2, RefreshCw, Play, CheckCircle, AlertCircle } from "lucide-react"
import { consumeSSEStream } from "@/lib/utils/sse"

interface AnalyzeButtonProps {
  jobId: number
  hasResume: boolean
  hasAnalysis: boolean
}

type AnalysisStatus = "idle" | "analyzing" | "complete" | "error"

export function AnalyzeButton({ jobId, hasResume, hasAnalysis }: AnalyzeButtonProps) {
  const router = useRouter()
  const [status, setStatus] = useState<AnalysisStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState("")
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const completedRef = useRef(false)

  const runAnalysis = async () => {
    setStatus("analyzing")
    setProgress(0)
    setProgressText("Starting analysis...")
    setError("")
    setDialogOpen(true)
    completedRef.current = false

    // Use AbortController with a 5-minute timeout for long analysis operations
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000)

    try {
      const response = await fetch("/api/agents/resume-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobApplicationId: jobId }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to start analysis")
      }

      await consumeSSEStream(response, {
        onEvent: (event) => {
          if (event.type === "progress") {
            setProgress(event.percentage as number)
            setProgressText(event.message as string)
          } else if (event.type === "complete") {
            completedRef.current = true
            setStatus("complete")
            setProgress(100)
            setProgressText("Analysis complete!")
            setTimeout(() => {
              setDialogOpen(false)
              router.refresh()
            }, 1500)
          } else if (event.type === "error") {
            throw new Error((event.error || event.message) as string)
          }
        },
      })

      // If stream ended without complete event, treat as error
      if (!completedRef.current) {
        throw new Error("Analysis stream ended unexpectedly")
      }
    } catch (err) {
      setStatus("error")
      if (err instanceof Error && err.name === "AbortError") {
        setError("Analysis timed out. Please try again.")
      } else {
        setError(err instanceof Error ? err.message : "Analysis failed")
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return (
    <>
      <Button onClick={runAnalysis} disabled={!hasResume || status === "analyzing"}>
        {status === "analyzing" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : hasAnalysis ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Re-analyze
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Analyze Resume
          </>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {status === "analyzing" && "Analyzing Resume..."}
              {status === "complete" && "Analysis Complete"}
              {status === "error" && "Analysis Failed"}
            </DialogTitle>
            <DialogDescription>
              {status === "analyzing" &&
                "Please wait while we analyze your resume against the job description."}
              {status === "complete" && "Your resume has been analyzed successfully."}
              {status === "error" && "There was a problem analyzing your resume."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {status === "analyzing" && (
              <>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">{progressText}</p>
              </>
            )}

            {status === "complete" && (
              <div className="flex flex-col items-center gap-2 py-4">
                <CheckCircle className="h-12 w-12 text-success" />
                <p className="text-sm text-muted-foreground">Redirecting...</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-2 py-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
