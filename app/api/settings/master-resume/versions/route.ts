import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { masterResumeVersions } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/settings/master-resume/versions - List all master resume versions
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const versions = await db.query.masterResumeVersions.findMany({
      with: {
        resume: {
          columns: {
            id: true,
            filename: true,
            fileType: true,
            createdAt: true,
          },
        },
      },
      orderBy: [desc(masterResumeVersions.versionNumber)],
    })

    return NextResponse.json({ versions })
  } catch (error) {
    console.error("Error fetching resume versions:", error)
    return NextResponse.json(
      { error: "Failed to fetch resume versions" },
      { status: 500 }
    )
  }
}
