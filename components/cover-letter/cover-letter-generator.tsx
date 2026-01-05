"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Loader2, Wand2, CheckCircle, AlertCircle, Lightbulb } from "lucide-react"
import { consumeSSEStream } from "@/lib/utils/sse"

interface CoverLetterGeneratorProps {
  jobId: number
  hasAnalysis: boolean
  hasCoverLetters: boolean
}

type GenerationStatus = "idle" | "generating" | "complete" | "error"

export function CoverLetterGenerator({
  jobId,
  hasAnalysis,
  hasCoverLetters,
}: CoverLetterGeneratorProps) {
  const router = useRouter()

  const [tone, setTone] = useState<"formal" | "conversational" | "enthusiastic">("formal")
  const [length, setLength] = useState<"short" | "medium" | "long">("medium")
  const [useInsights, setUseInsights] = useState(true)

  const [status, setStatus] = useState<GenerationStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState("")
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleGenerate = async () => {
    setStatus("generating")
    setProgress(0)
    setProgressText("Starting generation...")
    setError("")
    setDialogOpen(true)

    try {
      const response = await fetch("/api/agents/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobApplicationId: jobId,
          tone,
          length,
          useAnalysisInsights: useInsights && hasAnalysis,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to start generation")
      }

      await consumeSSEStream(response, {
        onEvent: (event) => {
          if (event.type === "progress") {
            setProgress(event.percentage as number)
            setProgressText(event.message as string)
          } else if (event.type === "complete") {
            setStatus("complete")
            setProgress(100)
            setProgressText("Cover letter generated!")
            setTimeout(() => {
              setDialogOpen(false)
              router.refresh()
            }, 1500)
          } else if (event.type === "error") {
            throw new Error(event.error as string)
          }
        },
      })
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Generation failed")
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Generate New Cover Letter</CardTitle>
          <CardDescription>
            Customize the tone and length of your cover letter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tone Selection */}
          <div className="space-y-3">
            <Label className="text-base">Tone</Label>
            <RadioGroup
              value={tone}
              onValueChange={(v) => setTone(v as typeof tone)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <Label
                htmlFor="formal"
                className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  tone === "formal" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="formal" id="formal" />
                <div>
                  <div className="font-medium">Formal</div>
                  <div className="text-xs text-muted-foreground">Traditional business tone</div>
                </div>
              </Label>
              <Label
                htmlFor="conversational"
                className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  tone === "conversational" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="conversational" id="conversational" />
                <div>
                  <div className="font-medium">Conversational</div>
                  <div className="text-xs text-muted-foreground">Warm and friendly</div>
                </div>
              </Label>
              <Label
                htmlFor="enthusiastic"
                className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  tone === "enthusiastic" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="enthusiastic" id="enthusiastic" />
                <div>
                  <div className="font-medium">Enthusiastic</div>
                  <div className="text-xs text-muted-foreground">Energetic and passionate</div>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Length Selection */}
          <div className="space-y-3">
            <Label className="text-base">Length</Label>
            <RadioGroup
              value={length}
              onValueChange={(v) => setLength(v as typeof length)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <Label
                htmlFor="short"
                className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  length === "short" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="short" id="short" />
                <div>
                  <div className="font-medium">Short</div>
                  <div className="text-xs text-muted-foreground">200-300 words</div>
                </div>
              </Label>
              <Label
                htmlFor="medium"
                className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  length === "medium" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="medium" id="medium" />
                <div>
                  <div className="font-medium">Medium</div>
                  <div className="text-xs text-muted-foreground">300-450 words</div>
                </div>
              </Label>
              <Label
                htmlFor="long"
                className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  length === "long" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="long" id="long" />
                <div>
                  <div className="font-medium">Long</div>
                  <div className="text-xs text-muted-foreground">450-600 words</div>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Use Analysis Insights Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="use-insights" className="text-base cursor-pointer">
                Use Resume Analysis Insights
              </Label>
              <p className="text-sm text-muted-foreground">
                {hasAnalysis
                  ? "Incorporate your strengths and address skill gaps"
                  : "Run a resume analysis first to enable this option"}
              </p>
            </div>
            <Switch
              id="use-insights"
              checked={useInsights && hasAnalysis}
              onCheckedChange={setUseInsights}
              disabled={!hasAnalysis}
            />
          </div>

          {/* Tip when no analysis */}
          {!hasAnalysis && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Lightbulb className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>Tip:</strong> Run a Resume Analysis first for better results. The AI will use your
                strengths and skill gaps to craft a more targeted cover letter.
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={status === "generating"}
            className="w-full"
            size="lg"
          >
            {status === "generating" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                {hasCoverLetters ? "Generate Another Version" : "Generate Cover Letter"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Progress Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {status === "generating" && "Generating Cover Letter..."}
              {status === "complete" && "Generation Complete"}
              {status === "error" && "Generation Failed"}
            </DialogTitle>
            <DialogDescription>
              {status === "generating" &&
                "Please wait while we craft your personalized cover letter."}
              {status === "complete" && "Your cover letter has been generated successfully."}
              {status === "error" && "There was a problem generating your cover letter."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {status === "generating" && (
              <>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">{progressText}</p>
              </>
            )}

            {status === "complete" && (
              <div className="flex flex-col items-center gap-2 py-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-sm text-muted-foreground">Refreshing page...</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-2 py-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-sm text-destructive text-center">{error}</p>
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
