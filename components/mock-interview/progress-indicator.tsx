"use client"

import { Progress } from "@/components/ui/progress"

interface ProgressIndicatorProps {
  currentQuestion: number
  totalQuestions: number
  className?: string
}

export function ProgressIndicator({
  currentQuestion,
  totalQuestions,
  className,
}: ProgressIndicatorProps) {
  const percentage = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0

  return (
    <div className={className}>
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Question {currentQuestion} of {totalQuestions}</span>
        <span>{Math.round(percentage)}% complete</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}
