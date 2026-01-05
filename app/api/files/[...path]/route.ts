import { NextRequest, NextResponse } from "next/server"
import { readFile } from "@/lib/utils/file-storage"
import { logger } from "@/lib/utils/logger"
import { requireAuth } from "@/lib/auth/middleware"
import path from "path"
import fs from "fs/promises"

// File serving requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Allowed base directories for file serving
const ALLOWED_DIRS = [
  path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./data/uploads"),
  path.resolve(process.cwd(), process.env.EXPORT_DIR || "./data/exports"),
]

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".txt": "text/plain",
  ".json": "application/json",
  ".md": "text/markdown",
}

type RouteParams = { params: Promise<{ path: string[] }> }

/**
 * GET /api/files/[...path] - Serve files from secure storage
 *
 * This route serves files that are stored outside the public/ directory.
 * Files are only accessible through this authenticated endpoint.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { path: pathSegments } = await params

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: "File path required" }, { status: 400 })
    }

    // Construct requested file path
    const requestedPath = pathSegments.join("/")

    // Security: Prevent directory traversal attacks
    if (requestedPath.includes("..") || requestedPath.includes("~")) {
      logger.warn("Directory traversal attempt blocked", { path: requestedPath })
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 })
    }

    // Find which base directory this file belongs to
    let filePath: string | null = null
    let foundDir: string | null = null

    for (const baseDir of ALLOWED_DIRS) {
      const candidatePath = path.join(baseDir, requestedPath)
      const resolvedPath = path.resolve(candidatePath)

      // Security: Ensure resolved path is still within the base directory
      if (resolvedPath.startsWith(baseDir)) {
        try {
          await fs.access(resolvedPath, fs.constants.R_OK)
          filePath = resolvedPath
          foundDir = baseDir
          break
        } catch {
          // File doesn't exist in this directory, try next
        }
      }
    }

    if (!filePath || !foundDir) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // TODO: Add authentication check here when Issue #1 is implemented
    // Example:
    // const session = await getSession(request)
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }
    //
    // For resume files, also verify the user owns the job application
    // that references this file.

    // Read the file
    const fileBuffer = await readFile(filePath)

    // Determine MIME type
    const ext = path.extname(filePath).toLowerCase()
    const mimeType = MIME_TYPES[ext] || "application/octet-stream"

    // Get original filename from path
    const filename = path.basename(filePath)

    // Return file with appropriate headers
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
        // Prevent caching of sensitive files
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  } catch (error) {
    logger.error("Error serving file", error)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}
