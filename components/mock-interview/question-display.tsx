"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuestionDisplayProps {
  questionText: string
  category: string
  difficulty: "easy" | "medium" | "hard"
  questionNumber: number
  isFollowUp?: boolean
  voiceEnabled?: boolean
  isSpeaking?: boolean
  onToggleSpeak?: () => void
}

const difficultyColors = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const categoryLabels: Record<string, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  situational: "Situational",
  "company-specific": "Company",
  "role-specific": "Role",
  "follow-up": "Follow-up",
}

export function QuestionDisplay({
  questionText,
  category,
  difficulty,
  questionNumber,
  isFollowUp = false,
  voiceEnabled = false,
  isSpeaking = false,
  onToggleSpeak,
}: QuestionDisplayProps) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Q{questionNumber}</Badge>
            <Badge variant="secondary">{categoryLabels[category] || category}</Badge>
            <Badge className={difficultyColors[difficulty]}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
            {isFollowUp && (
              <Badge variant="outline" className="border-primary text-primary">
                Follow-up
              </Badge>
            )}
          </div>
          {voiceEnabled && onToggleSpeak && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSpeak}
              className={isSpeaking ? "text-primary" : ""}
              title={isSpeaking ? "Stop speaking" : "Read question aloud"}
            >
              {isSpeaking ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
        <p className="text-lg font-medium leading-relaxed">{questionText}</p>
      </CardContent>
    </Card>
  )
}
