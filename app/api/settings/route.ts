import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  userSettings,
  jobApplications,
  resumes,
  coverLetters,
  chatSessions,
  mockInterviewSessions,
} from "@/lib/db/schema"
import { eq, count } from "drizzle-orm"
import { parseRequestBody } from "@/lib/utils/api-validation"
import { requireAuth } from "@/lib/auth/middleware"
import { updateSettingsSchema } from "@/lib/schemas/settings"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Default settings ID (single-user app)
const DEFAULT_SETTINGS_ID = 1

// GET /api/settings - Fetch user settings
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    // Try to get existing settings
    let settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.id, DEFAULT_SETTINGS_ID),
      with: {
        masterResume: true,
      },
    })

    // Create default settings if none exist
    if (!settings) {
      const [newSettings] = await db
        .insert(userSettings)
        .values({})
        .returning()

      settings = {
        ...newSettings,
        masterResume: null,
      }
    }

    // Get storage stats
    const [jobCountResult] = await db.select({ count: count() }).from(jobApplications)
    const [resumeCountResult] = await db.select({ count: count() }).from(resumes)
    const [coverLetterCountResult] = await db.select({ count: count() }).from(coverLetters)
    const [chatSessionCountResult] = await db.select({ count: count() }).from(chatSessions)
    const [mockInterviewCountResult] = await db.select({ count: count() }).from(mockInterviewSessions)

    const storageStats = {
      jobCount: jobCountResult.count,
      resumeCount: resumeCountResult.count,
      coverLetterCount: coverLetterCountResult.count,
      chatSessionCount: chatSessionCountResult.count,
      mockInterviewCount: mockInterviewCountResult.count,
    }

    return NextResponse.json({ settings, storageStats })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

// PATCH /api/settings - Update user settings
export async function PATCH(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const parsed = await parseRequestBody(request, updateSettingsSchema)
    if (!parsed.success) return parsed.response

    const updates = parsed.data

    // Ensure settings row exists
    let settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.id, DEFAULT_SETTINGS_ID),
    })

    if (!settings) {
      // Create with provided values
      const [newSettings] = await db
        .insert(userSettings)
        .values({
          ...updates,
          updatedAt: new Date(),
        })
        .returning()
      settings = newSettings
    } else {
      // Build update object, filtering out undefined values
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      }

      // Only include fields that are explicitly provided (not undefined)
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key] = value
        }
      })

      await db
        .update(userSettings)
        .set(updateData)
        .where(eq(userSettings.id, DEFAULT_SETTINGS_ID))
    }

    // Fetch updated settings with relations
    const updatedSettings = await db.query.userSettings.findFirst({
      where: eq(userSettings.id, DEFAULT_SETTINGS_ID),
      with: {
        masterResume: true,
      },
    })

    return NextResponse.json({ settings: updatedSettings })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}
