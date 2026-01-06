"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Copy,
  Check,
  Edit3,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { copyToClipboard } from "@/lib/utils/clipboard"

interface SectionAnalysis {
  score: number
  strengths: string[]
  improvements: string[]
  rewrittenContent: string | null
}

interface LinkedInSummaryRewriteProps {
  currentSummary?: string
  analysis: SectionAnalysis
  suggestedSummary: string
}

export function LinkedInSummaryRewrite({
  currentSummary,
  analysis,
  suggestedSummary,
}: LinkedInSummaryRewriteProps) {
  const [editedSummary, setEditedSummary] = useState(suggestedSummary)
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  const handleCopy = async () => {
    setCopyError(null)
    const success = await copyToClipboard(editedSummary)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setCopyError("Failed to copy. Please select and copy manually.")
    }
  }

  const handleReset = () => {
    setEditedSummary(suggestedSummary)
    setIsEditing(false)
  }

  const characterCount = editedSummary.length
  const isOptimalLength = characterCount >= 1500 && characterCount <= 2600

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          About Section Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Summary Analysis */}
        {currentSummary && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-muted-foreground">
                Current About Section
              </h4>
              <Badge
                variant={analysis.score >= 60 ? "default" : "secondary"}
              >
                Score: {analysis.score}/100
              </Badge>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border max-h-40 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{currentSummary}</p>
            </div>

            {/* Strengths */}
            {analysis.strengths.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2 text-success">
                  <CheckCircle className="h-4 w-4" />
                  What&apos;s Working
                </h4>
                <ul className="space-y-1">
                  {analysis.strengths.map((strength, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-success">+</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {analysis.improvements.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Areas to Improve
                </h4>
                <ul className="space-y-1">
                  {analysis.improvements.map((improvement, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-warning">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Suggested Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground">
              Optimized About Section
            </h4>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs",
                  isOptimalLength
                    ? "text-success"
                    : characterCount < 1500
                      ? "text-warning"
                      : "text-destructive"
                )}
              >
                {characterCount}/2,600 characters
                {isOptimalLength && " (optimal)"}
              </span>
            </div>
          </div>

          {isEditing ? (
            <Textarea
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
          ) : (
            <div className="p-4 rounded-lg bg-success/10 border border-success/30 max-h-80 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{editedSummary}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCopy} variant="default">
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              {isEditing ? "Done Editing" : "Edit"}
            </Button>
            {editedSummary !== suggestedSummary && (
              <Button onClick={handleReset} variant="ghost">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
          {copyError && (
            <p className="text-xs text-destructive">{copyError}</p>
          )}

          {/* Tips */}
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <strong>Tip:</strong> LinkedIn shows the first ~300 characters
            before the &quot;see more&quot; link. Make sure your opening hook is
            compelling!
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
