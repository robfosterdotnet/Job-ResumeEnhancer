import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resumes, userSettings, masterResumeVersions } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"
import { saveUploadedFile } from "@/lib/utils/file-storage"
import { parseDocument, detectFileType } from "@/lib/parsers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_SETTINGS_ID = 1
const MAX_VERSIONS = 5

// POST /api/settings/master-resume - Upload a new master resume
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const contentType = request.headers.get("content-type") || ""

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const filename = file.name
    const fileType = detectFileType(filename)

    if (!fileType || fileType === "pasted") {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT" },
        { status: 400 }
      )
    }

    // Save the file
    const savedFile = await saveUploadedFile(file, "master-resumes")

    // Parse the document
    const buffer = Buffer.from(await file.arrayBuffer())
    const parseResult = await parseDocument(buffer, fileType)
    const parsedContent = parseResult.text

    // Create new resume record
    const [newResume] = await db
      .insert(resumes)
      .values({
        filename,
        originalContent: buffer.toString("base64"),
        parsedContent,
        filePath: savedFile.path,
        fileType,
      })
      .returning()

    // Get current version number
    const existingVersions = await db.query.masterResumeVersions.findMany({
      orderBy: [desc(masterResumeVersions.versionNumber)],
      limit: 1,
    })
    const nextVersion = existingVersions.length > 0 ? existingVersions[0].versionNumber + 1 : 1

    // Create version record
    await db.insert(masterResumeVersions).values({
      resumeId: newResume.id,
      versionNumber: nextVersion,
      changeNote: `Uploaded ${filename}`,
    })

    // Update settings to point to new master resume
    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.id, DEFAULT_SETTINGS_ID),
    })

    if (settings) {
      await db
        .update(userSettings)
        .set({
          masterResumeId: newResume.id,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.id, DEFAULT_SETTINGS_ID))
    } else {
      await db.insert(userSettings).values({
        masterResumeId: newResume.id,
      })
    }

    // Clean up old versions (keep only MAX_VERSIONS)
    const allVersions = await db.query.masterResumeVersions.findMany({
      orderBy: [desc(masterResumeVersions.createdAt)],
    })

    if (allVersions.length > MAX_VERSIONS) {
      const versionsToDelete = allVersions.slice(MAX_VERSIONS)
      for (const version of versionsToDelete) {
        await db.delete(masterResumeVersions).where(eq(masterResumeVersions.id, version.id))
      }
    }

    return NextResponse.json({
      resume: {
        id: newResume.id,
        filename: newResume.filename,
        fileType: newResume.fileType,
        createdAt: newResume.createdAt,
      },
      version: nextVersion,
    })
  } catch (error) {
    console.error("Error uploading master resume:", error)
    return NextResponse.json(
      { error: "Failed to upload resume" },
      { status: 500 }
    )
  }
}
