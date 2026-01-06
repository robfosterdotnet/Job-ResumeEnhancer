"use client"

import { useState, useCallback, useId } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PipelineColumn } from "./pipeline-column"
import { PipelineCard } from "./pipeline-card"
import { Kanban } from "lucide-react"
import { useRouter } from "next/navigation"

interface Job {
  id: number
  title: string
  company?: string | null
  fitScore?: number | null
  status: string
  pipelineOrder: number
}

interface JobPipelineProps {
  initialJobs: Job[]
}

const PIPELINE_STATUSES = [
  { id: "saved", color: "bg-gray-400" },
  { id: "analyzing", color: "bg-yellow-400" },
  { id: "analyzed", color: "bg-blue-400" },
  { id: "applied", color: "bg-purple-400" },
  { id: "interviewing", color: "bg-orange-400" },
  { id: "offered", color: "bg-green-400" },
] as const

const VALID_STATUSES = new Set<string>(PIPELINE_STATUSES.map(s => s.id))

const statusLabels: Record<string, string> = {
  saved: "Saved",
  analyzing: "Analyzing",
  analyzed: "Analyzed",
  applied: "Applied",
  interviewing: "Interviewing",
  offered: "Offered",
}

export function JobPipeline({ initialJobs }: JobPipelineProps) {
  const router = useRouter()
  const dndId = useId() // Stable ID for DndContext to prevent hydration mismatch
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [activeTab, setActiveTab] = useState("saved")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  )

  // Group jobs by status, with orphaned jobs going to "saved"
  const jobsByStatus = PIPELINE_STATUSES.reduce(
    (acc, status) => {
      acc[status.id] = jobs
        .filter((job) => job.status === status.id)
        .sort((a, b) => a.pipelineOrder - b.pipelineOrder)
      return acc
    },
    {} as Record<string, Job[]>
  )

  // Add orphaned jobs (invalid status) to "saved" column
  const orphanedJobs = jobs.filter((job) => !VALID_STATUSES.has(job.status))
  if (orphanedJobs.length > 0) {
    jobsByStatus["saved"] = [...jobsByStatus["saved"], ...orphanedJobs]
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const job = jobs.find((j) => j.id === active.id)
    if (job) setActiveJob(job)
  }, [jobs])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      setActiveJob(null)

      if (!over) return

      const jobId = active.id as number
      let newStatus = over.id as string

      // If dropped on a card (numeric id), find which column that card is in
      if (!VALID_STATUSES.has(newStatus)) {
        const targetJob = jobs.find((j) => j.id === Number(over.id))
        if (targetJob) {
          newStatus = targetJob.status
        } else {
          // Invalid drop target, abort
          return
        }
      }

      // Find the job being moved
      const job = jobs.find((j) => j.id === jobId)
      if (!job || job.status === newStatus) return

      // Optimistic update
      const previousJobs = [...jobs]
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      )

      try {
        // Update on server
        const response = await fetch(`/api/jobs/${jobId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            pipelineOrder: 0, // Could implement ordering within column
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update job status")
        }

        // Refresh to ensure UI is in sync
        router.refresh()
      } catch (error) {
        console.error("Failed to update job:", error)
        // Revert on error
        setJobs(previousJobs)
      }
    },
    [jobs, router]
  )

  const handleJobDeleted = useCallback(() => {
    // Refresh the page to get updated data
    router.refresh()
  }, [router])

  // Mobile: Tab-based view
  const MobileView = () => (
    <div className="md:hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 mb-4">
          {PIPELINE_STATUSES.slice(0, 3).map((status) => (
            <TabsTrigger key={status.id} value={status.id} className="text-xs">
              {statusLabels[status.id]}
              <span className="ml-1 text-muted-foreground">
                ({jobsByStatus[status.id]?.length || 0})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsList className="w-full grid grid-cols-3 mb-4">
          {PIPELINE_STATUSES.slice(3).map((status) => (
            <TabsTrigger key={status.id} value={status.id} className="text-xs">
              {statusLabels[status.id]}
              <span className="ml-1 text-muted-foreground">
                ({jobsByStatus[status.id]?.length || 0})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        {PIPELINE_STATUSES.map((status) => (
          <TabsContent key={status.id} value={status.id}>
            <DndContext
              id={`${dndId}-mobile-${status.id}`}
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <PipelineColumn
                id={status.id}
                title={statusLabels[status.id]}
                jobs={jobsByStatus[status.id] || []}
                color={status.color}
                onJobDeleted={handleJobDeleted}
              />
            </DndContext>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )

  // Desktop: Two-row Kanban grid (3 columns per row)
  const DesktopView = () => (
    <div className="hidden md:block">
      <DndContext
        id={`${dndId}-desktop`}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-4">
          {PIPELINE_STATUSES.map((status) => (
            <PipelineColumn
              key={status.id}
              id={status.id}
              title={statusLabels[status.id]}
              jobs={jobsByStatus[status.id] || []}
              color={status.color}
              onJobDeleted={handleJobDeleted}
            />
          ))}
        </div>
        <DragOverlay>
          {activeJob && (
            <PipelineCard
              id={activeJob.id}
              title={activeJob.title}
              company={activeJob.company}
              fitScore={activeJob.fitScore}
              status={activeJob.status}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )

  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Kanban className="h-5 w-5" />
            Job Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Add your first job application to see your pipeline!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Kanban className="h-5 w-5" />
          Job Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MobileView />
        <DesktopView />
      </CardContent>
    </Card>
  )
}
