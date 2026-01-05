import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { coverLetters } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { parseRequestBody } from "@/lib/utils/api-validation"
import { requireAuth } from "@/lib/auth/middleware"
import { safeJsonParse } from "@/lib/utils/safe-json"
import { logger } from "@/lib/utils/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

const updateSchema = z.object({
  editedContent: z.string().min(1),
})

// GET - Fetch a single cover letter
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const letterId = parseInt(id, 10)

    if (isNaN(letterId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const letter = await db.query.coverLetters.findFirst({
      where: eq(coverLetters.id, letterId),
    })

    if (!letter) {
      return NextResponse.json({ error: "Cover letter not found" }, { status: 404 })
    }

    return NextResponse.json({
      coverLetter: {
        ...letter,
        bodyParagraphs: safeJsonParse(letter.bodyParagraphs, []),
      },
    })
  } catch (error) {
    logger.error("Fetch cover letter error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: "Failed to fetch cover letter" },
      { status: 500 }
    )
  }
}

// PATCH - Update (edit) a cover letter
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { id } = await context.params
    const letterId = parseInt(id, 10)

    if (isNaN(letterId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const parsed = await parseRequestBody(request, updateSchema)
    if (!parsed.success) return parsed.response

    const [updated] = await db
      .update(coverLetters)
      .set({
        editedContent: parsed.data.editedContent,
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(coverLetters.id, letterId))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Cover letter not found" }, { status: 404 })
    }

    logger.info("Cover letter updated", { coverLetterId: letterId })

    return NextResponse.json({
      coverLetter: {
        ...updated,
        bodyParagraphs: safeJsonParse(updated.bodyParagraphs, []),
      },
    })
  } catch (error) {
    logger.error("Update cover letter error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: "Failed to update cover letter" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a cover letter
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { id } = await context.params
    const letterId = parseInt(id, 10)

    if (isNaN(letterId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    await db.delete(coverLetters).where(eq(coverLetters.id, letterId))

    logger.info("Cover letter deleted", { coverLetterId: letterId })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Delete cover letter error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: "Failed to delete cover letter" },
      { status: 500 }
    )
  }
}
