import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads"
const EXPORT_DIR = process.env.EXPORT_DIR || "./public/exports"
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

export function getPublicUrl(filePath: string): string {
  // Convert absolute path to public URL
  const publicPath = filePath
    .replace(/^.*public/, "")
    .replace(/\\/g, "/")

  return publicPath
}
