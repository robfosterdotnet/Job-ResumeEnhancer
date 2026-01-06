"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Wrench,
  Plus,
  Minus,
  Star,
  Copy,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { copyToClipboard } from "@/lib/utils/clipboard"

interface SkillsAnalysis {
  score: number
  missingKeySkills: string[]
  irrelevantSkills: string[]
  skillsToHighlight: string[]
}

interface LinkedInSkillsAnalysisProps {
  analysis: SkillsAnalysis
  currentSkills?: string[]
}

export function LinkedInSkillsAnalysis({
  analysis,
  currentSkills = [],
}: LinkedInSkillsAnalysisProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const handleCopyAll = async (skills: string[], section: string) => {
    const text = skills.join(", ")
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedSection(section)
      setTimeout(() => setCopiedSection(null), 2000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Skills Optimization
          <Badge
            variant={analysis.score >= 60 ? "default" : "secondary"}
            className="ml-auto"
          >
            Score: {analysis.score}/100
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Skills to Highlight */}
        {analysis.skillsToHighlight.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Star className="h-4 w-4" />
                Prioritize These Skills
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleCopyAll(analysis.skillsToHighlight, "highlight")
                }
              >
                {copiedSection === "highlight" ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Move these skills to the top of your skills list for better
              visibility
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.skillsToHighlight.map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                >
                  <Star className="h-3 w-3 mr-1 text-amber-500" />
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Missing Skills */}
        {analysis.missingKeySkills.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2 text-success">
                <Plus className="h-4 w-4" />
                Skills to Add
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleCopyAll(analysis.missingKeySkills, "missing")
                }
              >
                {copiedSection === "missing" ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              These skills are commonly searched by recruiters for your target
              role
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.missingKeySkills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-success/10 border-success/30"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Irrelevant Skills */}
        {analysis.irrelevantSkills.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
              <Minus className="h-4 w-4" />
              Consider Removing
            </h4>
            <p className="text-xs text-muted-foreground">
              These skills may be outdated or not relevant to your target role
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.irrelevantSkills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-muted text-muted-foreground"
                >
                  <Minus className="h-3 w-3 mr-1" />
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Current Skills */}
        {currentSkills.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Your Current Skills ({currentSkills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentSkills.map((skill, index) => {
                const isHighlighted = analysis.skillsToHighlight.some(
                  (s) => s.toLowerCase() === skill.toLowerCase()
                )
                const isIrrelevant = analysis.irrelevantSkills.some(
                  (s) => s.toLowerCase() === skill.toLowerCase()
                )

                return (
                  <Badge
                    key={index}
                    variant="outline"
                    className={cn(
                      isHighlighted &&
                        "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
                      isIrrelevant && "bg-muted line-through opacity-60"
                    )}
                  >
                    {skill}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <strong>Tip:</strong> LinkedIn allows up to 50 skills. The first 3 are
          shown prominently, so order matters!
        </div>
      </CardContent>
    </Card>
  )
}
