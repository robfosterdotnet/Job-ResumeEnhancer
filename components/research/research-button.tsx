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
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Search } from "lucide-react"
import { consumeSSEStream } from "@/lib/utils/sse"

interface ResearchButtonProps {
  jobId: number
  companyId?: number | null
  hasResearch: boolean
}

type ResearchStatus = "idle" | "researching" | "complete" | "error"

export function ResearchButton({
  jobId,
  companyId,
  hasResearch,
}: ResearchButtonProps) {
  const router = useRouter()
  const [status, setStatus] = useState<ResearchStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState("")
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const completedRef = useRef(false)

  const runResearch = async () => {
    if (!companyId) {
      setError("No company associated with this job application")
      return
    }

    setStatus("researching")
    setProgress(0)
    setProgressText("Starting research...")
    setError("")
    setDialogOpen(true)
    completedRef.current = false

    try {
      const response = await fetch("/api/agents/company-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, jobApplicationId: jobId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to start research")
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
            setProgressText("Research complete!")
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
        throw new Error("Research stream ended unexpectedly")
      }
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Research failed")
    }
  }

  return (
    <>
      <Button
        onClick={runResearch}
        disabled={!companyId || status === "researching"}
      >
        {status === "researching" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Researching...
          </>
        ) : hasResearch ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Re-research
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Research Company
          </>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {status === "researching" && "Researching Company..."}
              {status === "complete" && "Research Complete"}
              {status === "error" && "Research Failed"}
            </DialogTitle>
            <DialogDescription>
              {status === "researching" &&
                "Please wait while we gather information about the company."}
              {status === "complete" &&
                "Company research has been completed successfully."}
              {status === "error" &&
                "There was a problem researching the company."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {status === "researching" && (
              <>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {progressText}
                </p>
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
