"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  User,
  Briefcase,
  MessageSquare,
  HelpCircle,
  Trash2,
  RefreshCw,
  Linkedin,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  Loader2,
} from "lucide-react"

interface Question {
  question: string
  why: string
  category: string
}

interface SuggestedQuestion {
  question: string
  purpose: string
}

interface TalkingPoint {
  topic: string
  connection: string
}

export interface InterviewerData {
  id: number
  name: string
  role?: string | null
  interviewRole?: string | null
  headline?: string | null
  summary?: string | null
  location?: string | null
  linkedInUrl?: string | null
  rawLinkedInContent?: string | null
  expertiseAreasJson?: string | null
  likelyInterviewFocus?: string | null
  questionsTheyMayAskJson?: string | null
  suggestedQuestionsToAskJson?: string | null
  talkingPointsJson?: string | null
  interviewTipsJson?: string | null
  analysisStatus: string
}

interface InterviewerCardProps {
  interviewer: InterviewerData
  onDelete?: (id: number) => void
  onRefresh?: (id: number) => void
  isRefreshing?: boolean
}

function parseJsonSafe<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

function formatInterviewRole(role: string | null | undefined): string {
  if (!role) return ""
  const labels: Record<string, string> = {
    hiring_manager: "Hiring Manager",
    technical: "Technical",
    hr: "HR",
    peer: "Peer",
    executive: "Executive",
    other: "Other",
  }
  return labels[role] || role
}

function formatFocus(focus: string | null | undefined): string {
  if (!focus) return "Mixed"
  const labels: Record<string, string> = {
    technical: "Technical Focus",
    behavioral: "Behavioral Focus",
    culture: "Culture Fit Focus",
    mixed: "Mixed Focus",
  }
  return labels[focus] || focus
}

export function InterviewerCard({
  interviewer,
  onDelete,
  onRefresh,
  isRefreshing,
}: InterviewerCardProps) {
  const [expanded, setExpanded] = useState(false)

  const expertiseAreas = parseJsonSafe<string[]>(interviewer.expertiseAreasJson, [])
  const questions = parseJsonSafe<Question[]>(interviewer.questionsTheyMayAskJson, [])
  const suggestedQuestions = parseJsonSafe<SuggestedQuestion[]>(
    interviewer.suggestedQuestionsToAskJson,
    []
  )
  const talkingPoints = parseJsonSafe<TalkingPoint[]>(interviewer.talkingPointsJson, [])
  const tips = parseJsonSafe<string[]>(interviewer.interviewTipsJson, [])

  const hasAnalysis = interviewer.analysisStatus === "completed"
  const isAnalyzing = interviewer.analysisStatus === "analyzing"
  const displayRole = interviewer.role || interviewer.headline

  return (
    <Card className={isAnalyzing ? "opacity-75" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{interviewer.name}</CardTitle>
              {displayRole && (
                <p className="text-sm text-muted-foreground">{displayRole}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {interviewer.linkedInUrl && (
              <Button variant="outline" size="icon" asChild>
                <a
                  href={interviewer.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View LinkedIn Profile"
                >
                  <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                </a>
              </Button>
            )}
            {onRefresh && hasAnalysis && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onRefresh(interviewer.id)}
                disabled={isRefreshing}
                title="Re-analyze"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDelete(interviewer.id)}
                title="Remove interviewer"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          {interviewer.interviewRole && (
            <Badge variant="secondary">
              {formatInterviewRole(interviewer.interviewRole)}
            </Badge>
          )}
          {hasAnalysis && interviewer.likelyInterviewFocus && (
            <Badge variant="outline">
              {formatFocus(interviewer.likelyInterviewFocus)}
            </Badge>
          )}
          {isAnalyzing && (
            <Badge variant="outline" className="animate-pulse">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Analyzing...
            </Badge>
          )}
          {interviewer.analysisStatus === "pending" && (
            <Badge variant="outline" className="text-muted-foreground">
              No LinkedIn data
            </Badge>
          )}
          {interviewer.analysisStatus === "failed" && (
            <Badge variant="destructive">Analysis failed</Badge>
          )}
        </div>

        {/* Summary */}
        {interviewer.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {interviewer.summary}
          </p>
        )}

        {/* Expertise Areas */}
        {expertiseAreas.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Expertise Areas
            </h4>
            <div className="flex flex-wrap gap-2">
              {expertiseAreas.slice(0, expanded ? undefined : 4).map((area, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {area}
                </Badge>
              ))}
              {!expanded && expertiseAreas.length > 4 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{expertiseAreas.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Expandable detailed sections */}
        {hasAnalysis && (
          <>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setExpanded(!expanded)}
            >
              <span>{expanded ? "Hide Details" : "View Interview Prep"}</span>
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {expanded && (
              <div className="space-y-6 pt-2 border-t">
                {/* Questions They May Ask */}
                {questions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Questions They May Ask
                    </h4>
                    <ul className="space-y-3">
                      {questions.map((q, i) => (
                        <li key={i} className="text-sm border-l-2 border-primary/20 pl-3">
                          <p className="font-medium">&quot;{q.question}&quot;</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            <span className="font-medium">Why:</span> {q.why}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {q.category}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Questions to Ask Them */}
                {suggestedQuestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Questions to Ask Them
                    </h4>
                    <ul className="space-y-3">
                      {suggestedQuestions.map((q, i) => (
                        <li key={i} className="text-sm border-l-2 border-green-500/20 pl-3">
                          <p className="font-medium">&quot;{q.question}&quot;</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            <span className="font-medium">Purpose:</span> {q.purpose}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Talking Points */}
                {talkingPoints.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Talking Points & Common Ground
                    </h4>
                    <ul className="space-y-2">
                      {talkingPoints.map((point, i) => (
                        <li key={i} className="text-sm">
                          <span className="font-medium">{point.topic}</span>
                          <span className="text-muted-foreground"> — {point.connection}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Interview Tips */}
                {tips.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Tips for This Interview
                    </h4>
                    <ul className="space-y-2">
                      {tips.map((tip, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
