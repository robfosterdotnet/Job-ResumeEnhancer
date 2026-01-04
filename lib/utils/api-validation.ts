import { z, ZodSchema } from "zod"
import { NextResponse } from "next/server"

/**
 * Result type for parseRequestBody
 */
export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse }

/**
 * Parses and validates a request body against a Zod schema.
 * Returns the validated data or a pre-built error response.
 *
 * @param request - The incoming request
 * @param schema - The Zod schema to validate against
 * @returns Either validated data or an error response
 *
 * @example
 * const schema = z.object({ id: z.coerce.number().int() })
 * const result = await parseRequestBody(request, schema)
 * if (!result.success) return result.response
 * const { id } = result.data // typed correctly
 */
export async function parseRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ParseResult<T>> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Validation failed",
            details: result.error.flatten().fieldErrors,
          },
          { status: 400 }
        ),
      }
    }

    return { success: true, data: result.data }
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    }
  }
}

/**
 * Common Zod schemas for reuse across API routes
 */
export const commonSchemas = {
  /** Positive integer ID (coerces strings) */
  id: z.coerce.number().int().positive(),
  /** Optional positive integer ID */
  optionalId: z.coerce.number().int().positive().optional(),
  /** Non-empty string */
  nonEmptyString: z.string().min(1),
  /** Optional non-empty string */
  optionalString: z.string().optional(),
  /** Pagination params */
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
}
