import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { linkedInProfiles, linkedInAnalyses } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"
import { parseLinkedInText } from "@/lib/parsers/linkedin-parser"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/linkedin-profiles/[profileId] - Get a specific profile with analyses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { profileId } = await params
    const id = parseInt(profileId, 10)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid profile ID" },
        { status: 400 }
      )
    }

    const profile = await db.query.linkedInProfiles.findFirst({
      where: eq(linkedInProfiles.id, id),
      with: {
        analyses: {
          orderBy: [desc(linkedInAnalyses.createdAt)],
        },
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Error fetching LinkedIn profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch LinkedIn profile" },
      { status: 500 }
    )
  }
}

// PATCH /api/linkedin-profiles/[profileId] - Update a profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { profileId } = await params
    const id = parseInt(profileId, 10)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid profile ID" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { profileUrl, rawContent } = body

    // Check if profile exists
    const existing = await db.query.linkedInProfiles.findFirst({
      where: eq(linkedInProfiles.id, id),
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (profileUrl !== undefined) {
      updateData.profileUrl = profileUrl
    }

    if (rawContent) {
      // Re-parse the content
      const parsedProfile = parseLinkedInText(rawContent)
      updateData.rawContent = rawContent
      updateData.fullName = parsedProfile.fullName
      updateData.headline = parsedProfile.headline
      updateData.summary = parsedProfile.summary
      updateData.location = parsedProfile.location
      updateData.experienceJson = JSON.stringify(parsedProfile.experience)
      updateData.educationJson = JSON.stringify(parsedProfile.education)
      updateData.skillsJson = JSON.stringify(parsedProfile.skills)
      updateData.certificationsJson = JSON.stringify(parsedProfile.certifications)
    }

    const [updatedProfile] = await db
      .update(linkedInProfiles)
      .set(updateData)
      .where(eq(linkedInProfiles.id, id))
      .returning()

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error("Error updating LinkedIn profile:", error)
    return NextResponse.json(
      { error: "Failed to update LinkedIn profile" },
      { status: 500 }
    )
  }
}

// DELETE /api/linkedin-profiles/[profileId] - Delete a profile and its analyses
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { profileId } = await params
    const id = parseInt(profileId, 10)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid profile ID" },
        { status: 400 }
      )
    }

    // Check if profile exists
    const existing = await db.query.linkedInProfiles.findFirst({
      where: eq(linkedInProfiles.id, id),
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      )
    }

    // Delete related analyses first
    await db
      .delete(linkedInAnalyses)
      .where(eq(linkedInAnalyses.linkedInProfileId, id))

    // Delete the profile
    await db.delete(linkedInProfiles).where(eq(linkedInProfiles.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting LinkedIn profile:", error)
    return NextResponse.json(
      { error: "Failed to delete LinkedIn profile" },
      { status: 500 }
    )
  }
}
