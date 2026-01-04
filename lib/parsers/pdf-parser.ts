import pdf from "pdf-parse"

export interface ParseResult {
  text: string
  metadata?: {
    pages?: number
    info?: Record<string, unknown>
  }
}

export async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  try {
    const data = await pdf(buffer)

    return {
      text: data.text.trim(),
      metadata: {
        pages: data.numpages,
        info: data.info,
      },
    }
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function parsePdfFromFile(filePath: string): Promise<ParseResult> {
  const fs = await import("fs/promises")
  const buffer = await fs.readFile(filePath)
  return parsePdf(buffer)
}
