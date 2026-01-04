"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SkillGap {
  skill: string
  importance: "critical" | "important" | "nice-to-have"
  hasSkill: boolean
  suggestion?: string
}

interface SkillGapsProps {
  skillGaps: SkillGap[]
  matchedKeywords: string[]
  missingKeywords: string[]
}

export function SkillGaps({ skillGaps, matchedKeywords, missingKeywords }: SkillGapsProps) {
  const importanceColors = {
    critical: "text-destructive border-destructive",
    important: "text-warning border-warning",
    "nice-to-have": "text-muted-foreground border-muted-foreground",
  }

  const importanceLabels = {
    critical: "Critical",
    important: "Important",
    "nice-to-have": "Nice to Have",
  }

  const matchedSkills = skillGaps.filter((s) => s.hasSkill)
  const missingSkills = skillGaps.filter((s) => !s.hasSkill)

  return (
    <div className="space-y-6">
      {/* Skill Gap Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Skill Analysis
          </CardTitle>
          <CardDescription>
            {matchedSkills.length} matched, {missingSkills.length} gaps identified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Matched Skills */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-success">
                <CheckCircle className="h-4 w-4" />
                Skills You Have ({matchedSkills.length})
              </h4>
              {matchedSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matched skills identified yet.</p>
              ) : (
                <div className="space-y-2">
                  {matchedSkills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md bg-success/5"
                    >
                      <span className="text-sm">{skill.skill}</span>
                      <Badge variant="secondary" className="text-xs">
                        {importanceLabels[skill.importance]}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Missing Skills */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                Skill Gaps ({missingSkills.length})
              </h4>
              {missingSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skill gaps identified!</p>
              ) : (
                <div className="space-y-2">
                  {missingSkills.map((skill, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-2 rounded-md border-l-2",
                        importanceColors[skill.importance]
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{skill.skill}</span>
                        <Badge variant="secondary" className="text-xs">
                          {importanceLabels[skill.importance]}
                        </Badge>
                      </div>
                      {skill.suggestion && (
                        <p className="text-xs text-muted-foreground mt-1">{skill.suggestion}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords */}
      <Card>
        <CardHeader>
          <CardTitle>Keyword Analysis</CardTitle>
          <CardDescription>
            Keywords from the job description found in your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Matched Keywords */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Matched Keywords ({matchedKeywords.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {matchedKeywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No matched keywords yet.</p>
                ) : (
                  matchedKeywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="bg-success/10 text-success">
                      {keyword}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Missing Keywords ({missingKeywords.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {missingKeywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No missing keywords!</p>
                ) : (
                  missingKeywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="bg-destructive/10 text-destructive">
                      {keyword}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
