"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, User, AlertCircle } from "lucide-react"

interface InterviewerOption {
  id: number
  name: string
  role?: string | null
  interviewRole?: string | null
  expertiseAreasJson?: string | null
  likelyInterviewFocus?: string | null
  analysisStatus: string
}

interface InterviewerSelectorProps {
  interviewers: InterviewerOption[]
  selectedIds: number[]
  onChange: (selectedIds: number[]) => void
  disabled?: boolean
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

function parseJsonSafe<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

export function InterviewerSelector({
  interviewers,
  selectedIds,
  onChange,
  disabled,
}: InterviewerSelectorProps) {
  const [localSelected, setLocalSelected] = useState<number[]>(selectedIds)

  useEffect(() => {
    setLocalSelected(selectedIds)
  }, [selectedIds])

  const handleToggle = (id: number) => {
    const newSelected = localSelected.includes(id)
      ? localSelected.filter((i) => i !== id)
      : [...localSelected, id]
    setLocalSelected(newSelected)
    onChange(newSelected)
  }

  const handleSelectAll = () => {
    const analyzedIds = interviewers
      .filter((i) => i.analysisStatus === "completed")
      .map((i) => i.id)
    setLocalSelected(analyzedIds)
    onChange(analyzedIds)
  }

  const handleSelectNone = () => {
    setLocalSelected([])
    onChange([])
  }

  const analyzedInterviewers = interviewers.filter(
    (i) => i.analysisStatus === "completed"
  )

  if (interviewers.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Simulate Specific Interviewers
            </CardTitle>
            <CardDescription className="text-sm">
              Select interviewers to tailor questions to their expertise and style
            </CardDescription>
          </div>
          {analyzedInterviewers.length > 0 && (
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                disabled={disabled}
                className="text-primary hover:underline disabled:opacity-50"
              >
                Select all
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                type="button"
                onClick={handleSelectNone}
                disabled={disabled}
                className="text-muted-foreground hover:underline disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {interviewers.map((interviewer) => {
          const isAnalyzed = interviewer.analysisStatus === "completed"
          const expertiseAreas = parseJsonSafe<string[]>(
            interviewer.expertiseAreasJson,
            []
          )

          return (
            <div
              key={interviewer.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border ${
                localSelected.includes(interviewer.id)
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-muted/30"
              } ${!isAnalyzed ? "opacity-60" : ""}`}
            >
              <Checkbox
                id={`interviewer-${interviewer.id}`}
                checked={localSelected.includes(interviewer.id)}
                onCheckedChange={() => handleToggle(interviewer.id)}
                disabled={disabled || !isAnalyzed}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`interviewer-${interviewer.id}`}
                  className={`flex items-center gap-2 cursor-pointer ${
                    !isAnalyzed ? "cursor-not-allowed" : ""
                  }`}
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span className="font-medium truncate">{interviewer.name}</span>
                  {interviewer.interviewRole && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {formatInterviewRole(interviewer.interviewRole)}
                    </Badge>
                  )}
                </Label>
                {interviewer.role && (
                  <p className="text-xs text-muted-foreground mt-1 ml-6 truncate">
                    {interviewer.role}
                  </p>
                )}
                {isAnalyzed && expertiseAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 ml-6">
                    {expertiseAreas.slice(0, 3).map((area, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                    {expertiseAreas.length > 3 && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        +{expertiseAreas.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                {!isAnalyzed && (
                  <p className="text-xs text-amber-600 mt-1 ml-6 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Add LinkedIn profile to enable
                  </p>
                )}
              </div>
            </div>
          )
        })}

        {localSelected.length > 0 && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            {localSelected.length} interviewer{localSelected.length > 1 ? "s" : ""} selected.
            Questions will be tailored to their expertise and attributed to them during the interview.
          </p>
        )}

        {localSelected.length === 0 && analyzedInterviewers.length > 0 && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            No interviewers selected. The mock interview will use generic questions.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
