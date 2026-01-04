"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Heart, Star, Shield, Users, Leaf, Scale } from "lucide-react"
import { cn } from "@/lib/utils"

interface EthicsData {
  overallScore?: number
  diversityScore?: number
  environmentalScore?: number
  governanceScore?: number
  communityScore?: number
  analysis?: string
  strengths?: string[]
  concerns?: string[]
}

interface EthicsAlignmentProps {
  ethics: EthicsData | null
}

const ethicsCategories = [
  {
    key: "diversityScore",
    label: "Diversity & Inclusion",
    icon: Users,
    description: "Workforce diversity, inclusion initiatives, pay equity",
  },
  {
    key: "environmentalScore",
    label: "Environmental",
    icon: Leaf,
    description: "Sustainability, carbon footprint, environmental policies",
  },
  {
    key: "governanceScore",
    label: "Governance",
    icon: Scale,
    description: "Leadership ethics, board independence, transparency",
  },
  {
    key: "communityScore",
    label: "Community Impact",
    icon: Heart,
    description: "Charitable giving, community engagement, social impact",
  },
]

function getScoreColor(score: number): string {
  if (score >= 80) return "text-success"
  if (score >= 60) return "text-primary"
  if (score >= 40) return "text-warning"
  return "text-destructive"
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent"
  if (score >= 60) return "Good"
  if (score >= 40) return "Fair"
  return "Needs Improvement"
}

export function EthicsAlignment({ ethics }: EthicsAlignmentProps) {
  if (!ethics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Ethics & Values Alignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No ethics alignment data available yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Ethics & Values Alignment
        </CardTitle>
        <CardDescription>
          Analysis of company values, culture, and ethical practices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        {ethics.overallScore != null && (
          <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div
                className={cn(
                  "text-4xl font-bold",
                  getScoreColor(ethics.overallScore)
                )}
              >
                {ethics.overallScore}
              </div>
              <div className="text-sm text-muted-foreground">out of 100</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-warning" />
                <span className="font-medium">
                  {getScoreLabel(ethics.overallScore)}
                </span>
              </div>
              <Progress value={ethics.overallScore} className="h-2" />
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        <div className="grid gap-4 md:grid-cols-2">
          {ethicsCategories.map((category) => {
            const score = ethics[category.key as keyof EthicsData] as
              | number
              | undefined
            if (score == null) return null

            const Icon = category.icon

            return (
              <div
                key={category.key}
                className="border rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{category.label}</span>
                      <span
                        className={cn("font-bold", getScoreColor(score))}
                      >
                        {score}
                      </span>
                    </div>
                    <Progress value={score} className="h-1.5 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Analysis */}
        {ethics.analysis && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Analysis</h4>
            <p className="text-sm text-muted-foreground">{ethics.analysis}</p>
          </div>
        )}

        {/* Strengths & Concerns */}
        <div className="grid gap-4 md:grid-cols-2">
          {ethics.strengths && ethics.strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-success">Strengths</h4>
              <ul className="space-y-1">
                {ethics.strengths.map((strength, index) => (
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

          {ethics.concerns && ethics.concerns.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-warning">Concerns</h4>
              <ul className="space-y-1">
                {ethics.concerns.map((concern, index) => (
                  <li
                    key={index}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-warning">!</span>
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
