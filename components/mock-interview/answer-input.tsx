"use client"

import { useState, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { VoiceRecorder } from "./voice-recorder"
import { Send, SkipForward, Loader2 } from "lucide-react"

interface AnswerInputProps {
  onSubmit: (answer: string) => void
  onSkip: () => void
  isLoading?: boolean
  placeholder?: string
  voiceEnabled?: boolean
}

export function AnswerInput({
  onSubmit,
  onSkip,
  isLoading = false,
  placeholder = "Type your answer here...",
  voiceEnabled = false,
}: AnswerInputProps) {
  const [answer, setAnswer] = useState("")

  const handleSubmit = useCallback(() => {
    if (answer.trim() && !isLoading) {
      onSubmit(answer.trim())
      setAnswer("")
    }
  }, [answer, isLoading, onSubmit])

  const handleVoiceTranscript = useCallback((text: string) => {
    setAnswer((prev) => {
      const separator = prev.trim() ? " " : ""
      return prev + separator + text
    })
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div className="space-y-4">
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className="min-h-[120px] resize-none"
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {voiceEnabled && (
            <VoiceRecorder
              onTranscript={handleVoiceTranscript}
              isDisabled={isLoading}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={isLoading}
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!answer.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Answer
              </>
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Press Cmd/Ctrl + Enter to submit
      </p>
    </div>
  )
}
