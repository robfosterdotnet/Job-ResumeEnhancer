"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { History, Clock, Trophy, ArrowRight, Trash2 } from "lucide-react"

interface Session {
  id: number
  status: "setup" | "in_progress" | "completed" | "abandoned"
  feedbackMode: "immediate" | "summary"
  questionCount: number | null
  overallScore: number | null
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date | null
}

interface SessionHistoryProps {
  sessions: Session[]
  onSelectSession?: (sessionId: number) => void
  onDeleteSession?: (sessionId: number) => void
  className?: string
}

const statusLabels: Record<string, string> = {
  setup: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  abandoned: "Abandoned",
}

const statusColors: Record<string, string> = {
  setup: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  abandoned: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

function formatDate(date: Date | null): string {
  if (!date) return "Unknown"
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function getDuration(start: Date | null, end: Date | null): string {
  if (!start || !end) return "-"
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "<1 min"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

export function SessionHistory({
  sessions,
  onSelectSession,
  onDeleteSession,
  className,
}: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Practice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No practice sessions yet. Start your first mock interview!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Practice History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Score or Status */}
                <div className="flex-shrink-0 w-14 text-center">
                  {session.status === "completed" && session.overallScore !== null ? (
                    <div className="flex flex-col items-center">
                      <Trophy className="h-4 w-4 text-yellow-500 mb-1" />
                      <span className="text-lg font-bold">{session.overallScore}</span>
                    </div>
                  ) : (
                    <Badge className={statusColors[session.status]}>
                      {session.status === "in_progress" ? "..." : "-"}
                    </Badge>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={statusColors[session.status]} variant="outline">
                      {statusLabels[session.status]}
                    </Badge>
                    <Badge variant="outline">
                      {session.feedbackMode === "immediate" ? "Immediate Feedback" : "Summary Mode"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatDate(session.createdAt)}</span>
                    {session.status === "completed" && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getDuration(session.startedAt, session.completedAt)}
                      </span>
                    )}
                    <span>{session.questionCount} questions</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {onDeleteSession && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteSession(session.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {onSelectSession && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSelectSession(session.id)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
