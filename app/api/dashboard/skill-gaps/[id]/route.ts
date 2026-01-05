import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { aggregatedSkillGaps } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"
import { z } from "zod"
import { parseRequestBody } from "@/lib/utils/api-validation"
import { safeJsonParse } from "@/lib/utils/safe-json"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteParams = { params: Promise<{ id: string }> }

const updateSchema = z.object({
  isLearned: z.boolean(),
})

// PATCH /api/dashboard/skill-gaps/[id] - Mark skill as learned/unlearned
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    const skillId = parseInt(id, 10)

    if (isNaN(skillId)) {
      return NextResponse.json({ error: "Invalid skill ID" }, { status: 400 })
    }

    const parsed = await parseRequestBody(request, updateSchema)
    if (!parsed.success) return parsed.response

    const { isLearned } = parsed.data

    // Check if skill exists
    const existing = await db.query.aggregatedSkillGaps.findFirst({
      where: eq(aggregatedSkillGaps.id, skillId),
    })

    if (!existing) {
      return NextResponse.json({ error: "Skill gap not found" }, { status: 404 })
    }

    // Update the skill gap
    await db
      .update(aggregatedSkillGaps)
      .set({
        isLearned,
        learnedAt: isLearned ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(aggregatedSkillGaps.id, skillId))

    // Fetch updated record
    const updated = await db.query.aggregatedSkillGaps.findFirst({
      where: eq(aggregatedSkillGaps.id, skillId),
    })

    return NextResponse.json({
      success: true,
      skillGap: {
        ...updated,
        jobIds: safeJsonParse<number[]>(updated?.jobIdsJson, []),
      },
    })
  } catch (error) {
    console.error("Error updating skill gap:", error)
    return NextResponse.json(
      { error: "Failed to update skill gap" },
      { status: 500 }
    )
  }
}

// GET /api/dashboard/skill-gaps/[id] - Get a single skill gap
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    const skillId = parseInt(id, 10)

    if (isNaN(skillId)) {
      return NextResponse.json({ error: "Invalid skill ID" }, { status: 400 })
    }

    const skillGap = await db.query.aggregatedSkillGaps.findFirst({
      where: eq(aggregatedSkillGaps.id, skillId),
    })

    if (!skillGap) {
      return NextResponse.json({ error: "Skill gap not found" }, { status: 404 })
    }

    return NextResponse.json({
      skillGap: {
        ...skillGap,
        jobIds: safeJsonParse<number[]>(skillGap.jobIdsJson, []),
      },
    })
  } catch (error) {
    console.error("Error fetching skill gap:", error)
    return NextResponse.json(
      { error: "Failed to fetch skill gap" },
      { status: 500 }
    )
  }
}
