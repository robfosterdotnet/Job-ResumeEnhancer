import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { linkedInProfiles } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"
import { parseLinkedInText } from "@/lib/parsers/linkedin-parser"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/linkedin-profiles - List all saved profiles
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const profiles = await db.query.linkedInProfiles.findMany({
      orderBy: [desc(linkedInProfiles.updatedAt)],
      with: {
        analyses: {
          orderBy: (analyses, { desc }) => [desc(analyses.createdAt)],
          limit: 1, // Get only the latest analysis
        },
      },
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error("Error fetching LinkedIn profiles:", error)
    return NextResponse.json(
      { error: "Failed to fetch LinkedIn profiles" },
      { status: 500 }
    )
  }
}

// POST /api/linkedin-profiles - Save/create a new profile
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { profileUrl, rawContent } = body

    if (!rawContent || typeof rawContent !== "string") {
      return NextResponse.json(
        { error: "Raw content is required" },
        { status: 400 }
      )
    }

    // Parse the profile content
    const parsedProfile = parseLinkedInText(rawContent)

    const [newProfile] = await db
      .insert(linkedInProfiles)
      .values({
        profileUrl: profileUrl || null,
        fullName: parsedProfile.fullName,
        headline: parsedProfile.headline,
        summary: parsedProfile.summary,
        location: parsedProfile.location,
        experienceJson: JSON.stringify(parsedProfile.experience),
        educationJson: JSON.stringify(parsedProfile.education),
        skillsJson: JSON.stringify(parsedProfile.skills),
        certificationsJson: JSON.stringify(parsedProfile.certifications),
        rawContent,
      })
      .returning()

    return NextResponse.json({
      profile: newProfile,
      parsed: parsedProfile,
    })
  } catch (error) {
    console.error("Error creating LinkedIn profile:", error)
    return NextResponse.json(
      { error: "Failed to create LinkedIn profile" },
      { status: 500 }
    )
  }
}
