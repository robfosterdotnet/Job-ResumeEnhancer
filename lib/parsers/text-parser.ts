export interface ParseResult {
  text: string
}

export function parseText(content: string): ParseResult {
  return {
    text: content.trim(),
  }
}

export async function parseTextFromFile(filePath: string): Promise<ParseResult> {
  const fs = await import("fs/promises")
  const content = await fs.readFile(filePath, "utf-8")
  return parseText(content)
}
