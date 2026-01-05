/**
 * Secure file storage utility.
 *
 * IMPORTANT: Files are stored outside public/ directory to prevent direct access.
 * Use the authenticated file serving API route to download files.
 */
import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

// SECURITY: Default to data/ directory, NOT public/
// Files in public/ are directly accessible via URL
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./data/uploads"
const EXPORT_DIR = process.env.EXPORT_DIR || "./data/exports"
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10)
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export async function ensureDirectories(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  await fs.mkdir(EXPORT_DIR, { recursive: true })
}

export interface SavedFile {
  filename: string
  originalFilename: string
  path: string
  size: number
  mimeType: string
}

export async function saveUploadedFile(
  file: File,
  subdir?: string
): Promise<SavedFile> {
  await ensureDirectories()

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB`)
  }

  const ext = path.extname(file.name)
  const filename = `${uuidv4()}${ext}`
  const dir = subdir ? path.join(UPLOAD_DIR, subdir) : UPLOAD_DIR
  await fs.mkdir(dir, { recursive: true })
  const filePath = path.join(dir, filename)

  await fs.writeFile(filePath, buffer)

  return {
    filename,
    originalFilename: file.name,
    path: filePath,
    size: buffer.length,
    mimeType: file.type,
  }
}

export async function saveBuffer(
  buffer: Buffer,
  filename: string,
  subdir?: string
): Promise<string> {
  await ensureDirectories()

  const dir = subdir ? path.join(UPLOAD_DIR, subdir) : UPLOAD_DIR
  await fs.mkdir(dir, { recursive: true })
  const filePath = path.join(dir, filename)

  await fs.writeFile(filePath, buffer)

  return filePath
}

export async function readFile(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath)
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch (error) {
    // Ignore errors if file doesn't exist
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error
    }
  }
}

export async function saveExport(
  content: Buffer | string,
  filename: string
): Promise<string> {
  await ensureDirectories()

  const filePath = path.join(EXPORT_DIR, filename)
  await fs.writeFile(filePath, content)

  return filePath
}

/**
 * @deprecated Files are no longer served from public/ directory for security.
 * Use the authenticated file download API route instead: /api/files/[...path]
 *
 * This function is kept for backward compatibility but returns an empty string.
 */
export function getPublicUrl(_filePath: string): string {
  void _filePath
  console.warn(
    "getPublicUrl is deprecated. Files are now served through authenticated API routes."
  )
  return ""
}
