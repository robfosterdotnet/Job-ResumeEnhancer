import { z } from "zod"

/**
 * Safely parses a JSON string with a fallback value if parsing fails.
 * Handles null, undefined, malformed JSON, and unexpected data.
 *
 * @param value - The JSON string to parse
 * @param fallback - The fallback value if parsing fails
 * @returns The parsed value or the fallback
 */
export function safeJsonParse<T>(
  value: string | null | undefined,
  fallback: T
): T {
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.warn("Failed to parse JSON:", error)
    return fallback
  }
}

/**
 * Safely parses a JSON string and validates it against a Zod schema.
 * Returns the fallback if parsing fails or validation fails.
 *
 * @param value - The JSON string to parse
 * @param schema - The Zod schema to validate against
 * @param fallback - The fallback value if parsing or validation fails
 * @returns The parsed and validated value or the fallback
 */
export function safeJsonParseWithSchema<T>(
  value: string | null | undefined,
  schema: z.ZodType<T>,
  fallback: T
): T {
  if (!value) return fallback

  try {
    const parsed = JSON.parse(value)
    const result = schema.safeParse(parsed)
    return result.success ? result.data : fallback
  } catch {
    return fallback
  }
}
