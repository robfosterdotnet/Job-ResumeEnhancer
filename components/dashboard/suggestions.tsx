"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  Lightbulb,
  ArrowRight,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Suggestion {
  id: string
  priority: "high" | "medium" | "low"
  type: "action" | "reminder" | "tip"
  title: string
  description: string
  actionUrl?: string
  jobApplicationId?: number
}

interface SuggestionsProps {
  suggestions: Suggestion[]
}

const priorityConfig = {
  high: {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  medium: {
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  low: {
    icon: Sparkles,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
}

export function Suggestions({ suggestions }: SuggestionsProps) {
  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5" />
            Suggested Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">
              You&apos;re all caught up! Check back later for suggestions.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-5 w-5" />
          Suggested Next Steps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => {
          const config = priorityConfig[suggestion.priority]
          const Icon = config.icon

          const content = (
            <div
              className={cn(
                "p-3 rounded-lg border transition-colors",
                config.bgColor,
                config.borderColor,
                suggestion.actionUrl && "hover:bg-opacity-80 cursor-pointer"
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{suggestion.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {suggestion.description}
                  </p>
                </div>
                {suggestion.actionUrl && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            </div>
          )

          if (suggestion.actionUrl) {
            return (
              <Link key={suggestion.id} href={suggestion.actionUrl}>
                {content}
              </Link>
            )
          }

          return <div key={suggestion.id}>{content}</div>
        })}
      </CardContent>
    </Card>
  )
}
