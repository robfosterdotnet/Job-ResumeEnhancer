import mammoth from "mammoth"

export interface ParseResult {
  text: string
  html?: string
  messages?: string[]
}

export async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    const htmlResult = await mammoth.convertToHtml({ buffer })

    return {
      text: result.value.trim(),
      html: htmlResult.value,
      messages: [...result.messages, ...htmlResult.messages].map(m => m.message),
    }
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function parseDocxFromFile(filePath: string): Promise<ParseResult> {
  const fs = await import("fs/promises")
  const buffer = await fs.readFile(filePath)
  return parseDocx(buffer)
}
