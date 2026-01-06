"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Copy, Check } from "lucide-react"
import { copyToClipboard } from "@/lib/utils/clipboard"

interface LinkedInKeywordsProps {
  keywords: string[]
  targetRole?: string
}

export function LinkedInKeywords({
  keywords,
  targetRole,
}: LinkedInKeywordsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyAll = async () => {
    const text = keywords.join(", ")
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Keywords to Add
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyAll}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-success" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy All
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Include these keywords throughout your profile to improve visibility
          in recruiter searches
          {targetRole && (
            <span>
              {" "}
              for <strong>{targetRole}</strong> positions
            </span>
          )}
          .
        </p>

        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <Badge
              key={index}
              variant="outline"
              className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
            >
              {keyword}
            </Badge>
          ))}
        </div>

        {/* Placement Tips */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <h4 className="font-medium text-sm">Where to Add Keywords:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>
              <strong>Headline:</strong> Include your primary target role and
              key skill
            </li>
            <li>
              <strong>About Section:</strong> Naturally weave keywords into your
              story
            </li>
            <li>
              <strong>Job Titles:</strong> Use industry-standard titles
              recruiters search for
            </li>
            <li>
              <strong>Experience Descriptions:</strong> Include action verbs and
              technical terms
            </li>
            <li>
              <strong>Skills Section:</strong> Add both hard and soft skills
            </li>
          </ul>
        </div>

        {/* SEO Note */}
        <p className="text-xs text-muted-foreground italic">
          LinkedIn&apos;s search algorithm indexes your entire profile. Using
          these keywords consistently can significantly increase your
          discoverability.
        </p>
      </CardContent>
    </Card>
  )
}
