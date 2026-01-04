"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Star, ThumbsUp, ThumbsDown, Briefcase, Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { safeJsonParse } from "@/lib/utils/safe-json"

interface GlassdoorData {
  id: number
  overallRating?: number | null
  cultureRating?: number | null
  workLifeBalance?: number | null
  compensationRating?: number | null
  careerOpportunities?: number | null
  seniorManagement?: number | null
  recommendToFriend?: number | null
  ceoApproval?: number | null
  prosJson?: string | null
  consJson?: string | null
}

interface GlassdoorInsightsProps {
  glassdoor: GlassdoorData | null
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < Math.round(rating)
              ? "fill-warning text-warning"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  )
}

function getRatingColor(rating: number): string {
  if (rating >= 4) return "text-success"
  if (rating >= 3) return "text-warning"
  return "text-destructive"
}

export function GlassdoorInsights({ glassdoor }: GlassdoorInsightsProps) {
  if (!glassdoor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Employee Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No employee review data available yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const pros = safeJsonParse<string[]>(glassdoor.prosJson, [])
  const cons = safeJsonParse<string[]>(glassdoor.consJson, [])

  const ratingCategories = [
    { key: "cultureRating", label: "Culture", icon: Users },
    { key: "workLifeBalance", label: "Work-Life Balance", icon: Clock },
    { key: "compensationRating", label: "Compensation", icon: Briefcase },
    { key: "careerOpportunities", label: "Career Growth", icon: Star },
    { key: "seniorManagement", label: "Management", icon: Users },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Employee Reviews & Culture
        </CardTitle>
        <CardDescription>
          Insights from current and former employees
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        {glassdoor.overallRating != null && (
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div
                className={cn(
                  "text-4xl font-bold",
                  getRatingColor(glassdoor.overallRating)
                )}
              >
                {glassdoor.overallRating.toFixed(1)}
              </div>
              <StarRating rating={glassdoor.overallRating} />
            </div>
            <div className="flex-1 space-y-2">
              {glassdoor.recommendToFriend != null && (
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-success" />
                  <span className="text-sm">
                    <span className="font-medium">
                      {glassdoor.recommendToFriend}%
                    </span>{" "}
                    would recommend to a friend
                  </span>
                </div>
              )}
              {glassdoor.ceoApproval != null && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    <span className="font-medium">{glassdoor.ceoApproval}%</span>{" "}
                    CEO approval rating
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category Ratings */}
        <div className="grid gap-3">
          {ratingCategories.map((category) => {
            const rating = glassdoor[
              category.key as keyof GlassdoorData
            ] as number | null | undefined
            if (rating == null) return null

            return (
              <div key={category.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category.label}</span>
                  <div className="flex items-center gap-2">
                    <StarRating rating={rating} />
                    <span
                      className={cn("text-sm font-medium", getRatingColor(rating))}
                    >
                      {rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <Progress value={(rating / 5) * 100} className="h-1.5" />
              </div>
            )
          })}
        </div>

        {/* Pros and Cons */}
        {(pros.length > 0 || cons.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
            {/* Pros */}
            {pros.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2 text-success">
                  <ThumbsUp className="h-4 w-4" />
                  What Employees Like
                </h4>
                <ul className="space-y-2">
                  {pros.slice(0, 5).map((pro: string, index: number) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground pl-4 border-l-2 border-success"
                    >
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cons */}
            {cons.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <ThumbsDown className="h-4 w-4" />
                  What Employees Dislike
                </h4>
                <ul className="space-y-2">
                  {cons.slice(0, 5).map((con: string, index: number) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground pl-4 border-l-2 border-destructive"
                    >
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
