"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, ChevronDown, ChevronUp, Copy, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { copyToClipboard } from "@/lib/utils/clipboard"

interface Enhancement {
  section: string
  currentText: string
  suggestedText: string
  rationale: string
}

interface EnhancementSuggestionsProps {
  enhancements: Enhancement[]
}

export function EnhancementSuggestions({ enhancements }: EnhancementSuggestionsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copyError, setCopyError] = useState<number | null>(null)

  const handleCopy = async (text: string, index: number) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedIndex(index)
      setCopyError(null)
      setTimeout(() => setCopiedIndex(null), 2000)
    } else {
      setCopyError(index)
      setTimeout(() => setCopyError(null), 2000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Enhancement Suggestions ({enhancements.length})
        </CardTitle>
        <CardDescription>
          Specific changes to improve your resume for this position
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {enhancements.length === 0 ? (
          <p className="text-muted-foreground text-sm">No enhancements suggested yet.</p>
        ) : (
          enhancements.map((item, index) => (
            <div
              key={index}
              className="border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-medium">{item.section}</span>
                </div>
                {expandedIndex === index ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              <div
                className={cn(
                  "transition-all duration-200 overflow-hidden",
                  expandedIndex === index ? "max-h-[1000px]" : "max-h-0"
                )}
              >
                <div className="p-4 pt-0 space-y-4">
                  {/* Current Text */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Current Text:</p>
                    <div className="bg-destructive/10 rounded-md p-3 text-sm">
                      {item.currentText || "Not found in resume"}
                    </div>
                  </div>

                  {/* Suggested Text */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Suggested Text:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(item.suggestedText, index)}
                        className="h-8"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="mr-1 h-3 w-3 text-green-500" />
                            Copied
                          </>
                        ) : copyError === index ? (
                          <>
                            <AlertCircle className="mr-1 h-3 w-3 text-destructive" />
                            Failed
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-3 w-3" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="bg-success/10 rounded-md p-3 text-sm">
                      {item.suggestedText}
                    </div>
                  </div>

                  {/* Rationale */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Why this helps:</p>
                    <p className="text-sm text-muted-foreground">{item.rationale}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
