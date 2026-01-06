"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ClipboardCheck,
  Check,
  X,
  HelpCircle,
  User,
  Type,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  Award,
  Link,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface CompletenessChecklist {
  hasPhoto: boolean | null
  hasHeadline: boolean
  hasSummary: boolean
  hasExperience: boolean
  hasEducation: boolean
  hasSkills: boolean
  hasCertifications: boolean
  hasCustomUrl?: boolean | null
}

interface LinkedInCompletenessChecklistProps {
  checklist: CompletenessChecklist
  completenessScore: number
}

interface ChecklistItemProps {
  icon: LucideIcon
  label: string
  description: string
  value: boolean | null
  importance: "critical" | "important" | "nice-to-have"
}

function ChecklistItem({
  icon: Icon,
  label,
  description,
  value,
  importance,
}: ChecklistItemProps) {
  const getStatusIcon = () => {
    if (value === null) return <HelpCircle className="h-4 w-4 text-muted-foreground" />
    if (value) return <Check className="h-4 w-4 text-success" />
    return <X className="h-4 w-4 text-destructive" />
  }

  const getImportanceBadge = () => {
    switch (importance) {
      case "critical":
        return (
          <Badge variant="destructive" className="text-xs">
            Critical
          </Badge>
        )
      case "important":
        return (
          <Badge variant="secondary" className="text-xs">
            Important
          </Badge>
        )
      case "nice-to-have":
        return (
          <Badge variant="outline" className="text-xs">
            Optional
          </Badge>
        )
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        value === true && "bg-success/5 border-success/20",
        value === false && "bg-destructive/5 border-destructive/20",
        value === null && "bg-muted/50"
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{label}</span>
          <div className="flex items-center gap-2">
            {!value && getImportanceBadge()}
            {getStatusIcon()}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function LinkedInCompletenessChecklist({
  checklist,
  completenessScore,
}: LinkedInCompletenessChecklistProps) {
  const items: ChecklistItemProps[] = [
    {
      icon: User,
      label: "Profile Photo",
      description:
        "Profiles with photos get 21x more views and 9x more connection requests",
      value: checklist.hasPhoto,
      importance: "critical",
    },
    {
      icon: Type,
      label: "Custom Headline",
      description:
        "Your headline appears in search results and under your name everywhere",
      value: checklist.hasHeadline,
      importance: "critical",
    },
    {
      icon: FileText,
      label: "About Section",
      description:
        "Tell your professional story and include keywords for search visibility",
      value: checklist.hasSummary,
      importance: "critical",
    },
    {
      icon: Briefcase,
      label: "Work Experience",
      description:
        "Add at least 2-3 positions with detailed descriptions and achievements",
      value: checklist.hasExperience,
      importance: "critical",
    },
    {
      icon: GraduationCap,
      label: "Education",
      description: "Include degrees, certifications, and relevant coursework",
      value: checklist.hasEducation,
      importance: "important",
    },
    {
      icon: Wrench,
      label: "Skills (5+)",
      description:
        "Add at least 5 skills; skills help you appear in recruiter searches",
      value: checklist.hasSkills,
      importance: "important",
    },
    {
      icon: Award,
      label: "Certifications",
      description:
        "Professional certifications boost credibility and searchability",
      value: checklist.hasCertifications,
      importance: "nice-to-have",
    },
    {
      icon: Link,
      label: "Custom Profile URL",
      description:
        "A custom URL (linkedin.com/in/yourname) looks more professional",
      value: checklist.hasCustomUrl ?? null,
      importance: "nice-to-have",
    },
  ]

  const completedCount = items.filter((item) => item.value === true).length
  const totalCheckable = items.filter((item) => item.value !== null).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Profile Completeness
          </div>
          <Badge
            variant={completenessScore >= 80 ? "default" : "secondary"}
            className="text-lg px-3 py-1"
          >
            {completenessScore}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {completedCount} of {totalCheckable} completed
            </span>
            <span className="font-medium">
              {completedCount === items.length ? "All-Star Profile!" : ""}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                completenessScore >= 80
                  ? "bg-success"
                  : completenessScore >= 60
                    ? "bg-primary"
                    : completenessScore >= 40
                      ? "bg-warning"
                      : "bg-destructive"
              )}
              style={{ width: `${completenessScore}%` }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-2">
          {items.map((item, index) => (
            <ChecklistItem key={index} {...item} />
          ))}
        </div>

        {/* Tip */}
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <strong>LinkedIn All-Star:</strong> Complete all sections to achieve
          &quot;All-Star&quot; status, which can make your profile up to 40x
          more likely to receive opportunities.
        </div>
      </CardContent>
    </Card>
  )
}
