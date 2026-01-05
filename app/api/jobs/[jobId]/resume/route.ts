import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jobApplications, resumes } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { parseDocument, detectFileType } from "@/lib/parsers"
import { saveUploadedFile } from "@/lib/utils/file-storage"
import { requireAuth } from "@/lib/auth/middleware"
import { logActivity } from "@/lib/activity/logger"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteParams = { params: Promise<{ jobId: string }> }

// POST /api/jobs/[jobId]/resume - Upload or paste resume
export async function POST(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { jobId } = await params
    const id = parseInt(jobId, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 })
    }

    // Check if job exists
    const job = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.id, id),
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const contentType = request.headers.get("content-type") || ""

    let originalContent: string
    let parsedContent: string
    let filename: string | undefined
    let filePath: string | undefined
    let fileType: "pdf" | "docx" | "txt" | "pasted"

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get("file") as File | null

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      filename = file.name
      fileType = detectFileType(filename)

      // Save the file
      const savedFile = await saveUploadedFile(file, "resumes")
      filePath = savedFile.path

      // Parse the file
      const buffer = Buffer.from(await file.arrayBuffer())
      originalContent = buffer.toString("base64") // Store original as base64 for binary files
      const parseResult = await parseDocument(buffer, fileType)
      parsedContent = parseResult.text
    } else {
      // Handle pasted text
      const body = await request.json()
      const { text } = body

      if (!text) {
        return NextResponse.json({ error: "No text provided" }, { status: 400 })
      }

      originalContent = text
      parsedContent = text
      fileType = "pasted"
    }

    // Create or update resume
    const [resume] = await db
      .insert(resumes)
      .values({
        filename,
        originalContent,
        parsedContent,
        filePath,
        fileType,
      })
      .returning()

    // Update job application with resume
    await db
      .update(jobApplications)
      .set({
        resumeId: resume.id,
        updatedAt: new Date(),
      })
      .where(eq(jobApplications.id, id))

    // Log activity
    await logActivity({
      jobApplicationId: id,
      activityType: "resume_uploaded",
      title: `Resume uploaded for "${job.title}"`,
      description: filename ? `File: ${filename}` : "Text pasted",
      metadata: { resumeId: resume.id, filename, fileType },
    })

    return NextResponse.json({
      resume: {
        id: resume.id,
        filename: resume.filename,
        fileType: resume.fileType,
        parsedContent: resume.parsedContent,
      },
    })
  } catch (error) {
    console.error("Error uploading resume:", error)
    return NextResponse.json(
      { error: "Failed to upload resume" },
      { status: 500 }
    )
  }
}
