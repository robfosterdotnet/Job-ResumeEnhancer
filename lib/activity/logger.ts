import { db } from "@/lib/db"
import { activityLogs, aggregatedSkillGaps } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { safeJsonParse } from "@/lib/utils/safe-json"

export type ActivityType =
  | "job_created"
  | "resume_uploaded"
  | "analysis_completed"
  | "research_completed"
  | "status_changed"
  | "cover_letter_generated"
  | "interview_scheduled"
  | "interview_completed"

interface LogActivityParams {
  jobApplicationId?: number
  activityType: ActivityType
  title: string
  description?: string
  metadata?: Record<string, unknown>
}

/**
 * Log an activity to the activity_logs table.
 * This is used to track user actions for the activity feed on the dashboard.
 */
export async function logActivity({
  jobApplicationId,
  activityType,
  title,
  description,
  metadata,
}: LogActivityParams): Promise<void> {
  try {
    await db.insert(activityLogs).values({
      jobApplicationId,
      activityType,
      title,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
  } catch (error) {
    // Log but don't throw - activity logging should not break the main flow
    console.error("Failed to log activity:", error)
  }
}

interface SkillGap {
  skill: string
  importance?: "critical" | "important" | "nice-to-have"
}

/**
 * Update the aggregated skill gaps table with new skill gaps from an analysis.
 * This tracks which skills appear across multiple job applications.
 */
export async function updateAggregatedSkillGaps(
  jobApplicationId: number,
  skillGaps: SkillGap[]
): Promise<void> {
  if (!skillGaps || skillGaps.length === 0) return

  try {
    for (const gap of skillGaps) {
      const normalizedSkill = gap.skill.toLowerCase().trim()

      // Check if this skill already exists
      const existing = await db.query.aggregatedSkillGaps.findFirst({
        where: eq(aggregatedSkillGaps.skill, normalizedSkill),
      })

      if (existing) {
        // Update existing skill gap
        const existingJobIds = safeJsonParse<number[]>(existing.jobIdsJson, [])
        if (!existingJobIds.includes(jobApplicationId)) {
          existingJobIds.push(jobApplicationId)
          await db
            .update(aggregatedSkillGaps)
            .set({
              occurrenceCount: existingJobIds.length,
              jobIdsJson: JSON.stringify(existingJobIds),
              updatedAt: new Date(),
            })
            .where(eq(aggregatedSkillGaps.id, existing.id))
        }
      } else {
        // Insert new skill gap
        await db.insert(aggregatedSkillGaps).values({
          skill: normalizedSkill,
          occurrenceCount: 1,
          jobIdsJson: JSON.stringify([jobApplicationId]),
          isLearned: false,
        })
      }
    }
  } catch (error) {
    console.error("Failed to update aggregated skill gaps:", error)
  }
}

/**
 * Get activity type display info for the activity feed.
 */
export function getActivityDisplayInfo(activityType: ActivityType): {
  icon: string
  color: string
} {
  switch (activityType) {
    case "job_created":
      return { icon: "plus", color: "text-blue-500" }
    case "resume_uploaded":
      return { icon: "upload", color: "text-green-500" }
    case "analysis_completed":
      return { icon: "check-circle", color: "text-primary" }
    case "research_completed":
      return { icon: "search", color: "text-purple-500" }
    case "status_changed":
      return { icon: "arrow-right", color: "text-orange-500" }
    case "cover_letter_generated":
      return { icon: "file-text", color: "text-cyan-500" }
    case "interview_scheduled":
      return { icon: "calendar", color: "text-yellow-500" }
    case "interview_completed":
      return { icon: "mic", color: "text-emerald-500" }
    default:
      return { icon: "activity", color: "text-muted-foreground" }
  }
}
