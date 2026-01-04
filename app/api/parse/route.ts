import { NextRequest, NextResponse } from "next/server"
import { parseDocument, detectFileType } from "@/lib/parsers"
import { requireAuth } from "@/lib/auth/middleware"

// Document parsing requires Node.js runtime for native modules
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/parse - Parse a document (PDF, DOCX, TXT)
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const fileType = detectFileType(file.name)
    const buffer = Buffer.from(await file.arrayBuffer())

    const result = await parseDocument(buffer, fileType)

    return NextResponse.json({
      text: result.text,
      metadata: result.metadata,
      fileType,
      filename: file.name,
    })
  } catch (error) {
    console.error("Error parsing document:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse document" },
      { status: 500 }
    )
  }
}
