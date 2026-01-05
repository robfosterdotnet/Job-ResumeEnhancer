"use client"

import Link from "next/link"
import {
  Plus,
  Upload,
  CheckCircle,
  Search,
  ArrowRight,
  FileText,
  Calendar,
  Mic,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

type ActivityType =
  | "job_created"
  | "resume_uploaded"
  | "analysis_completed"
  | "research_completed"
  | "status_changed"
  | "cover_letter_generated"
  | "interview_scheduled"
  | "interview_completed"

interface ActivityItemProps {
  id: number
  activityType: ActivityType
  title: string
  description?: string | null
  createdAt: Date
  jobApplication?: {
    id: number
    title: string
    company?: string | null
  } | null
}

const activityConfig: Record<
  ActivityType,
  { icon: typeof Plus; color: string; bgColor: string }
> = {
  job_created: { icon: Plus, color: "text-blue-600", bgColor: "bg-blue-100" },
  resume_uploaded: { icon: Upload, color: "text-green-600", bgColor: "bg-green-100" },
  analysis_completed: { icon: CheckCircle, color: "text-primary", bgColor: "bg-primary/10" },
  research_completed: { icon: Search, color: "text-purple-600", bgColor: "bg-purple-100" },
  status_changed: { icon: ArrowRight, color: "text-orange-600", bgColor: "bg-orange-100" },
  cover_letter_generated: { icon: FileText, color: "text-cyan-600", bgColor: "bg-cyan-100" },
  interview_scheduled: { icon: Calendar, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  interview_completed: { icon: Mic, color: "text-emerald-600", bgColor: "bg-emerald-100" },
}

export function ActivityItem({
  activityType,
  title,
  description,
  createdAt,
  jobApplication,
}: ActivityItemProps) {
  const config = activityConfig[activityType] || {
    icon: Activity,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  }
  const Icon = config.icon

  const content = (
    <div className="flex gap-3 py-3 px-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
      <div className={cn("p-2 rounded-full h-fit", config.bgColor)}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  )

  if (jobApplication) {
    return <Link href={`/jobs/${jobApplication.id}`}>{content}</Link>
  }

  return content
}
