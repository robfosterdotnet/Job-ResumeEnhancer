import { parsePdf, parsePdfFromFile } from "./pdf-parser"
import { parseDocx, parseDocxFromFile } from "./docx-parser"
import { parseText, parseTextFromFile } from "./text-parser"

export type FileType = "pdf" | "docx" | "txt" | "pasted"

export interface ParseResult {
  text: string
  metadata?: Record<string, unknown>
}

export async function parseDocument(
  buffer: Buffer,
  fileType: FileType
): Promise<ParseResult> {
  switch (fileType) {
    case "pdf":
      return parsePdf(buffer)
    case "docx":
      return parseDocx(buffer)
    case "txt":
      return parseText(buffer.toString("utf-8"))
    case "pasted":
      return parseText(buffer.toString("utf-8"))
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}

export async function parseDocumentFromFile(
  filePath: string,
  fileType: FileType
): Promise<ParseResult> {
  switch (fileType) {
    case "pdf":
      return parsePdfFromFile(filePath)
    case "docx":
      return parseDocxFromFile(filePath)
    case "txt":
      return parseTextFromFile(filePath)
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}

export function detectFileType(filename: string): FileType {
  const ext = filename.toLowerCase().split(".").pop()
  switch (ext) {
    case "pdf":
      return "pdf"
    case "docx":
    case "doc":
      return "docx"
    case "txt":
      return "txt"
    default:
      return "txt"
  }
}

export { parsePdf, parsePdfFromFile } from "./pdf-parser"
export { parseDocx, parseDocxFromFile } from "./docx-parser"
export { parseText, parseTextFromFile } from "./text-parser"
