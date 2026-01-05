"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { DeleteJobButton } from "@/components/jobs/delete-job-button"

interface PipelineCardProps {
  id: number
  title: string
  company?: string | null
  fitScore?: number | null
  status: string
  isDragging?: boolean
  onDelete?: () => void
}

export function PipelineCard({
  id,
  title,
  company,
  fitScore,
  isDragging,
  onDelete,
}: PipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getFitScoreBadgeVariant = (score: number): "success" | "warning" | "destructive" => {
    if (score >= 80) return "success"
    if (score >= 60) return "warning"
    return "destructive"
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-manipulation",
        (isDragging || isSortableDragging) && "opacity-50"
      )}
    >
      <Card
        className={cn(
          "p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative",
          (isDragging || isSortableDragging) && "shadow-lg ring-2 ring-primary"
        )}
      >
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="p-1 -ml-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <Link href={`/jobs/${id}`} className="flex-1 min-w-0">
            <div className="space-y-1">
              <p className="text-sm font-medium truncate pr-6">{title}</p>
              {company && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{company}</span>
                </div>
              )}
              {fitScore !== null && fitScore !== undefined && (
                <Badge
                  variant={getFitScoreBadgeVariant(fitScore)}
                  className="text-xs"
                >
                  {fitScore}% fit
                </Badge>
              )}
            </div>
          </Link>
          <div
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <DeleteJobButton
              jobId={id}
              jobTitle={title}
              variant="ghost"
              size="icon"
              showText={false}
              onDeleted={onDelete}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
