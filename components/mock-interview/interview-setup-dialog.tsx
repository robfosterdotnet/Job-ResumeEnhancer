"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Play, Mic, Volume2 } from "lucide-react"
import { InterviewerSelector } from "@/components/interviewers/interviewer-selector"

interface InterviewerOption {
  id: number
  name: string
  role?: string | null
  interviewRole?: string | null
  expertiseAreasJson?: string | null
  likelyInterviewFocus?: string | null
  analysisStatus: string
}

interface InterviewSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStart: (config: InterviewConfig) => void
  availableCategories?: string[]
  maxQuestions?: number
  interviewers?: InterviewerOption[]
}

export interface InterviewConfig {
  feedbackMode: "immediate" | "summary"
  questionCount: number
  selectedCategories: string[]
  difficulty: "mixed" | "easy" | "medium" | "hard"
  voiceEnabled: boolean
  selectedInterviewerIds: number[]
}

const categoryLabels: Record<string, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  situational: "Situational",
  "company-specific": "Company",
  "role-specific": "Role",
}

const difficultyOptions = [
  { value: "mixed", label: "Mixed" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

const questionCountOptions = [5, 10, 15, 20]

export function InterviewSetupDialog({
  open,
  onOpenChange,
  onStart,
  availableCategories = ["behavioral", "technical", "situational", "company-specific", "role-specific"],
  maxQuestions = 20,
  interviewers = [],
}: InterviewSetupDialogProps) {
  const [config, setConfig] = useState<InterviewConfig>({
    feedbackMode: "immediate",
    questionCount: 10,
    selectedCategories: [],
    difficulty: "mixed",
    voiceEnabled: false,
    selectedInterviewerIds: [],
  })

  const toggleCategory = (category: string) => {
    setConfig((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter((c) => c !== category)
        : [...prev.selectedCategories, category],
    }))
  }

  const handleStart = () => {
    onStart(config)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Start Mock Interview
          </DialogTitle>
          <DialogDescription>
            Configure your practice session. You can customize the feedback style,
            number of questions, and focus areas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feedback Mode */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Feedback Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfig((prev) => ({ ...prev, feedbackMode: "immediate" }))}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  config.feedbackMode === "immediate"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-medium text-sm">Immediate</p>
                <p className="text-xs text-muted-foreground">Get feedback after each answer</p>
              </button>
              <button
                onClick={() => setConfig((prev) => ({ ...prev, feedbackMode: "summary" }))}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  config.feedbackMode === "summary"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-medium text-sm">Summary</p>
                <p className="text-xs text-muted-foreground">Get all feedback at the end</p>
              </button>
            </div>
          </div>

          {/* Question Count */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Number of Questions</Label>
            <div className="flex gap-2">
              {questionCountOptions
                .filter((count) => count <= maxQuestions)
                .map((count) => (
                  <button
                    key={count}
                    onClick={() => setConfig((prev) => ({ ...prev, questionCount: count }))}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      config.questionCount === count
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {count}
                  </button>
                ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Difficulty</Label>
            <div className="flex gap-2">
              {difficultyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      difficulty: option.value as InterviewConfig["difficulty"],
                    }))
                  }
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    config.difficulty === option.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Focus Categories
              <span className="text-muted-foreground font-normal ml-1">
                (leave empty for all)
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => (
                <Badge
                  key={category}
                  variant={config.selectedCategories.includes(category) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCategory(category)}
                >
                  {categoryLabels[category] || category}
                </Badge>
              ))}
            </div>
          </div>

          {/* Voice Options */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Voice Options</Label>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, voiceEnabled: !prev.voiceEnabled }))}
              className={`w-full p-3 rounded-lg border text-left transition-colors flex items-center gap-3 ${
                config.voiceEnabled
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <Volume2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Enable Voice</p>
                <p className="text-xs text-muted-foreground">
                  Speak your answers and hear questions read aloud
                </p>
              </div>
            </button>
          </div>

          {/* Interviewer Selection */}
          {interviewers.length > 0 && (
            <InterviewerSelector
              interviewers={interviewers}
              selectedIds={config.selectedInterviewerIds}
              onChange={(ids) =>
                setConfig((prev) => ({ ...prev, selectedInterviewerIds: ids }))
              }
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStart}>
            <Play className="h-4 w-4 mr-2" />
            Begin Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
