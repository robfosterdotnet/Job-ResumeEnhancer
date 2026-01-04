"use client"

import { useState } from "react"
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

  const runAnalysis = async () => {
    setStatus("analyzing")
    setProgress(0)
    setProgressText("Starting analysis...")
    setError("")
    setDialogOpen(true)

    try {
      const response = await fetch("/api/agents/resume-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobApplicationId: jobId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to start analysis")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response stream")
      }

      const decoder = new TextDecoder()
      let buffer = ""

      let receivedComplete = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              receivedComplete = true
              setStatus("complete")
              setProgress(100)
              setProgressText("Analysis complete!")
              setTimeout(() => {
                setDialogOpen(false)
                router.refresh()
              }, 1500)
              return
            }

            try {
              const event = JSON.parse(data)
              if (event.type === "progress") {
                setProgress(event.percentage)
                setProgressText(event.message)
              } else if (event.type === "complete") {
                receivedComplete = true
                setStatus("complete")
                setProgress(100)
                setProgressText("Analysis complete!")
                setTimeout(() => {
                  setDialogOpen(false)
                  router.refresh()
                }, 1500)
                return
              } else if (event.type === "error") {
                throw new Error(event.error || event.message)
              }
            } catch (parseErr) {
              // Re-throw if it's an Error we threw ourselves
              if (parseErr instanceof Error && parseErr.message) {
                throw parseErr
              }
              // Otherwise ignore JSON parsing errors for non-JSON lines
            }
          }
        }
      }

      // If stream ended without complete event, treat as error
      if (!receivedComplete) {
        throw new Error("Analysis stream ended unexpectedly")
      }
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Analysis failed")
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
