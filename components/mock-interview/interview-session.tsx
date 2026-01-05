"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProgressIndicator } from "./progress-indicator"
import { QuestionDisplay } from "./question-display"
import { AnswerInput } from "./answer-input"
import { FeedbackDisplay } from "./feedback-display"
import { SessionSummary } from "./session-summary"
import { useSpeechOutput } from "./speech-output"
import { Loader2, StopCircle, AlertCircle } from "lucide-react"

type SessionState =
  | "loading"
  | "ready"
  | "asking"
  | "answering"
  | "evaluating"
  | "feedback"
  | "summary"
  | "error"

interface CurrentQuestion {
  questionText: string
  category: string
  difficulty: "easy" | "medium" | "hard"
  questionNumber: number
  totalQuestions: number
  isFollowUp?: boolean
}

interface CurrentFeedback {
  score: number
  feedback: string
  suggestedImprovement: string
  keyPointsCovered: string[]
  keyPointsMissed: string[]
  starAnalysis?: {
    situation: boolean
    task: boolean
    action: boolean
    result: boolean
  }
}

interface SummaryData {
  overallScore: number
  summaryFeedback: string
  strengthAreas: string[]
  improvementAreas: string[]
  categoryScores: Record<string, number | null>
  recommendations: string[]
}

interface InterviewSessionProps {
  sessionId: number
  jobApplicationId: number
  feedbackMode: "immediate" | "summary"
  voiceEnabled: boolean
  onSessionEnd?: () => void
}

export function InterviewSession({
  sessionId,
  jobApplicationId,
  feedbackMode,
  voiceEnabled,
  onSessionEnd,
}: InterviewSessionProps) {
  const router = useRouter()
  const [state, setState] = useState<SessionState>("loading")
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null)
  const [currentFeedback, setCurrentFeedback] = useState<CurrentFeedback | null>(null)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const endInterviewRef = useRef<(() => Promise<void>) | undefined>(undefined)
  const currentQuestionRef = useRef<CurrentQuestion | null>(null)

  // Speech output for reading questions aloud
  const { speak, stop: stopSpeaking, isSpeaking, toggle: toggleSpeak, isSupported: speechSupported } = useSpeechOutput()

  // Keep currentQuestionRef in sync with currentQuestion state
  useEffect(() => {
    currentQuestionRef.current = currentQuestion
  }, [currentQuestion])

  // Handle SSE events - using useCallback to memoize
  const handleEvent = useCallback((event: Record<string, unknown>) => {
    switch (event.type) {
      case "status":
        setStatusMessage(event.message as string || "")
        break

      case "question":
        setCurrentQuestion({
          questionText: event.questionText as string,
          category: event.category as string,
          difficulty: event.difficulty as "easy" | "medium" | "hard",
          questionNumber: event.questionNumber as number,
          totalQuestions: event.totalQuestions as number,
          isFollowUp: false,
        })
        setCurrentFeedback(null)
        setState("asking")
        // Speak the question if voice is enabled
        if (voiceEnabled && speechSupported) {
          speak(event.questionText as string)
        }
        break

      case "follow_up":
        setCurrentQuestion({
          questionText: event.questionText as string,
          category: "follow-up",
          difficulty: currentQuestionRef.current?.difficulty || "medium",
          questionNumber: event.questionNumber as number,
          totalQuestions: event.totalQuestions as number,
          isFollowUp: true,
        })
        setCurrentFeedback(null)
        setState("asking")
        // Speak follow-up if voice enabled
        if (voiceEnabled && speechSupported) {
          speak(event.questionText as string)
        }
        break

      case "answer_recorded":
        // In summary mode, just move to next question
        setState("asking")
        break

      case "feedback":
        setCurrentFeedback({
          score: event.score as number,
          feedback: event.feedback as string,
          suggestedImprovement: event.suggestedImprovement as string,
          keyPointsCovered: event.keyPointsCovered as string[],
          keyPointsMissed: event.keyPointsMissed as string[],
          starAnalysis: event.starAnalysis as CurrentFeedback["starAnalysis"],
        })
        setState("feedback")
        break

      case "question_skipped":
        // Move to next question
        break

      case "interview_complete":
        // Interview is done, need to end it - use ref to avoid circular dependency
        endInterviewRef.current?.()
        break

      case "summary":
        setSummary({
          overallScore: event.overallScore as number,
          summaryFeedback: event.summaryFeedback as string,
          strengthAreas: event.strengthAreas as string[],
          improvementAreas: event.improvementAreas as string[],
          categoryScores: event.categoryScores as Record<string, number | null>,
          recommendations: event.recommendations as string[],
        })
        setState("summary")
        break

      case "complete":
        setSummary((currentSummary) => {
          if (!currentSummary) {
            // If we got complete without summary, interview ended
            setState("summary")
          }
          return currentSummary
        })
        break

      case "error":
        setError(event.error as string)
        setState("error")
        break

      case "done":
        // Stream complete
        break
    }
  }, [voiceEnabled, speechSupported, speak])

  // Process SSE stream - using useCallback to memoize
  const processStream = useCallback(async (response: Response) => {
    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response stream")

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") break

          try {
            const event = JSON.parse(data)
            handleEvent(event)
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }, [handleEvent])

  // Start the interview session
  const startInterview = useCallback(async () => {
    setState("loading")
    setStatusMessage("Starting interview...")

    try {
      abortControllerRef.current = new AbortController()

      const response = await fetch("/api/agents/mock-interviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "start" }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error("Failed to start interview")
      }

      await processStream(response)
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Failed to start interview")
      setState("error")
    }
  }, [sessionId, processStream])

  // Submit an answer
  const submitAnswer = useCallback(
    async (answer: string) => {
      setState("evaluating")
      setStatusMessage("Evaluating your answer...")
      stopSpeaking()

      try {
        abortControllerRef.current = new AbortController()

        const response = await fetch("/api/agents/mock-interviewer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, action: "answer", userAnswer: answer }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error("Failed to submit answer")
        }

        await processStream(response)
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : "Failed to submit answer")
        setState("error")
      }
    },
    [sessionId, stopSpeaking, processStream]
  )

  // Skip current question
  const skipQuestion = useCallback(async () => {
    setState("evaluating")
    setStatusMessage("Skipping question...")
    stopSpeaking()

    try {
      abortControllerRef.current = new AbortController()

      const response = await fetch("/api/agents/mock-interviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "skip" }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error("Failed to skip question")
      }

      await processStream(response)
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Failed to skip question")
      setState("error")
    }
  }, [sessionId, stopSpeaking, processStream])

  // End the interview
  const endInterview = useCallback(async () => {
    setState("loading")
    setStatusMessage("Generating summary...")
    stopSpeaking()

    try {
      abortControllerRef.current = new AbortController()

      const response = await fetch("/api/agents/mock-interviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "end" }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error("Failed to end interview")
      }

      await processStream(response)
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Failed to end interview")
      setState("error")
    }
  }, [sessionId, stopSpeaking, processStream])

  // Keep endInterviewRef in sync
  useEffect(() => {
    endInterviewRef.current = endInterview
  }, [endInterview])

  // Start interview on mount
  useEffect(() => {
    startInterview()

    return () => {
      abortControllerRef.current?.abort()
      stopSpeaking()
    }
  }, [startInterview, stopSpeaking])

  // Proceed to next question after viewing feedback
  const proceedToNext = () => {
    setCurrentFeedback(null)
    // The next question should already be queued from the event stream
    if (currentQuestion) {
      setState("asking")
    }
  }

  // Handle starting a new session
  const handleStartNewSession = () => {
    onSessionEnd?.()
    router.push(`/jobs/${jobApplicationId}/mock-interview`)
  }

  // Handle viewing details
  const handleViewDetails = () => {
    router.push(`/jobs/${jobApplicationId}/mock-interview/${sessionId}/review`)
  }

  // Render based on state
  if (state === "loading") {
    return (
      <Card className="min-h-[400px] flex items-center justify-center">
        <CardContent className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{statusMessage || "Loading..."}</p>
        </CardContent>
      </Card>
    )
  }

  if (state === "error") {
    return (
      <Card className="min-h-[400px] flex items-center justify-center">
        <CardContent className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={startInterview}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (state === "summary" && summary) {
    return (
      <SessionSummary
        overallScore={summary.overallScore}
        summaryFeedback={summary.summaryFeedback}
        strengthAreas={summary.strengthAreas}
        improvementAreas={summary.improvementAreas}
        categoryScores={summary.categoryScores}
        recommendations={summary.recommendations}
        onStartNewSession={handleStartNewSession}
        onViewDetails={handleViewDetails}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      {currentQuestion && (
        <ProgressIndicator
          currentQuestion={currentQuestion.questionNumber}
          totalQuestions={currentQuestion.totalQuestions}
        />
      )}

      {/* Question */}
      {currentQuestion && (state === "asking" || state === "evaluating" || state === "feedback") && (
        <QuestionDisplay
          questionText={currentQuestion.questionText}
          category={currentQuestion.category}
          difficulty={currentQuestion.difficulty}
          questionNumber={currentQuestion.questionNumber}
          isFollowUp={currentQuestion.isFollowUp}
          voiceEnabled={voiceEnabled && speechSupported}
          isSpeaking={isSpeaking}
          onToggleSpeak={() => toggleSpeak(currentQuestion.questionText)}
        />
      )}

      {/* Answer Input */}
      {(state === "asking" || state === "evaluating") && (
        <Card>
          <CardHeader>
            <CardTitle>Your Answer</CardTitle>
          </CardHeader>
          <CardContent>
            <AnswerInput
              onSubmit={submitAnswer}
              onSkip={skipQuestion}
              isLoading={state === "evaluating"}
              voiceEnabled={voiceEnabled}
            />
          </CardContent>
        </Card>
      )}

      {/* Feedback (Immediate Mode) */}
      {state === "feedback" && currentFeedback && feedbackMode === "immediate" && (
        <>
          <FeedbackDisplay
            score={currentFeedback.score}
            feedback={currentFeedback.feedback}
            suggestedImprovement={currentFeedback.suggestedImprovement}
            keyPointsCovered={currentFeedback.keyPointsCovered}
            keyPointsMissed={currentFeedback.keyPointsMissed}
            starAnalysis={currentFeedback.starAnalysis}
          />
          <div className="flex justify-center">
            <Button onClick={proceedToNext}>Next Question</Button>
          </div>
        </>
      )}

      {/* End Interview Button */}
      {(state === "asking" || state === "feedback") && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={endInterview}>
            <StopCircle className="h-4 w-4 mr-2" />
            End Interview Early
          </Button>
        </div>
      )}
    </div>
  )
}
