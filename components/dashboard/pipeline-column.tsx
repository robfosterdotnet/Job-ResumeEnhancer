"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { PipelineCard } from "./pipeline-card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface Job {
  id: number
  title: string
  company?: string | null
  fitScore?: number | null
  status: string
}

interface PipelineColumnProps {
  id: string
  title: string
  jobs: Job[]
  color: string
  onJobDeleted?: () => void
}

const statusLabels: Record<string, string> = {
  saved: "Saved",
  analyzing: "Analyzing",
  analyzed: "Analyzed",
  applied: "Applied",
  interviewing: "Interviewing",
  offered: "Offered",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
}

export function PipelineColumn({ id, title, jobs, color, onJobDeleted }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  const jobIds = jobs.map((job) => job.id)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-muted/50 rounded-lg p-3",
        "flex flex-col min-h-[200px] max-h-[350px]",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", color)} />
          <h3 className="font-semibold text-sm">{statusLabels[id] || title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {jobs.length}
          </span>
        </div>
        {id === "saved" && (
          <Link href="/jobs/new">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Jobs */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-[100px]">
        <SortableContext items={jobIds} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <PipelineCard
              key={job.id}
              id={job.id}
              title={job.title}
              company={job.company}
              fitScore={job.fitScore}
              status={job.status}
              onDelete={onJobDeleted}
            />
          ))}
        </SortableContext>

        {jobs.length === 0 && (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}
