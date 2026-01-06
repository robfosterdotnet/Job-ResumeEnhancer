"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Type,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { copyToClipboard } from "@/lib/utils/clipboard"

interface HeadlineAnalysis {
  currentScore: number
  issues: string[]
  suggestions: string[]
}

interface LinkedInHeadlineSuggestionsProps {
  currentHeadline?: string
  analysis: HeadlineAnalysis
  suggestedHeadlines: string[]
}

export function LinkedInHeadlineSuggestions({
  currentHeadline,
  analysis,
  suggestedHeadlines,
}: LinkedInHeadlineSuggestionsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)

  const handleCopy = async (text: string, index: number) => {
    setCopyError(null)
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } else {
      setCopyError("Failed to copy. Please select and copy manually.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Headline Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Headline Analysis */}
        {currentHeadline && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Current Headline
            </h4>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="font-medium">{currentHeadline}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={analysis.currentScore >= 60 ? "default" : "secondary"}
                >
                  Score: {analysis.currentScore}/100
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {currentHeadline.length}/220 characters
                </span>
              </div>
            </div>

            {/* Issues */}
            {analysis.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Issues to Address
                </h4>
                <ul className="space-y-1">
                  {analysis.issues.map((issue, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-warning">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvement Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2 text-success">
                  <CheckCircle className="h-4 w-4" />
                  Suggestions
                </h4>
                <ul className="space-y-1">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-success">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Suggested Headlines */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">
            Suggested Headlines
          </h4>
          <div className="space-y-2">
            {suggestedHeadlines.map((headline, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start justify-between gap-3 p-3 rounded-lg border transition-colors",
                  index === 0
                    ? "bg-success/10 border-success/30"
                    : "bg-card hover:bg-muted/50"
                )}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Option {index + 1}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{headline}</p>
                  <span className="text-xs text-muted-foreground">
                    {headline.length}/220 characters
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(headline, index)}
                  className="flex-shrink-0"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-4 w-4 text-success" />
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
          {copyError && (
            <p className="text-xs text-destructive">{copyError}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
