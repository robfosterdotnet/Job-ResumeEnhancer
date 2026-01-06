"use client"

import { InterviewerCard, InterviewerData } from "./interviewer-card"
import { Users } from "lucide-react"

interface InterviewerListProps {
  interviewers: InterviewerData[]
  onDelete?: (id: number) => void
  onRefresh?: (id: number) => void
  refreshingId?: number | null
}

export function InterviewerList({
  interviewers,
  onDelete,
  onRefresh,
  refreshingId,
}: InterviewerListProps) {
  if (interviewers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/30">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">No interviewers added yet</p>
        <p className="text-sm mt-2 max-w-md mx-auto">
          Add the people you&apos;ll be interviewing with to get AI-powered preparation
          insights, likely questions, and talking points.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {interviewers.map((interviewer) => (
        <InterviewerCard
          key={interviewer.id}
          interviewer={interviewer}
          onDelete={onDelete}
          onRefresh={onRefresh}
          isRefreshing={refreshingId === interviewer.id}
        />
      ))}
    </div>
  )
}
