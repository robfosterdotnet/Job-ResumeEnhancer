/**
 * Authentication middleware for API routes.
 *
 * This implements simple bearer token authentication for single-user deployment.
 * Set the AUTH_SECRET_TOKEN environment variable to enable authentication.
 *
 * If AUTH_SECRET_TOKEN is not set, authentication is disabled (development mode).
 */

import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/utils/logger"

/**
 * Validates the authentication token from request headers.
 *
 * @param request - The incoming request
 * @returns true if authenticated, false otherwise
 */
export function isAuthenticated(request: NextRequest): boolean {
  const authSecret = process.env.AUTH_SECRET_TOKEN

  // If no secret is configured, allow all requests (development mode)
  if (!authSecret) {
    return true
  }

  const authHeader = request.headers.get("authorization")
  if (!authHeader) {
    return false
  }

  // Support "Bearer <token>" format
  const [scheme, token] = authHeader.split(" ")
  if (scheme.toLowerCase() !== "bearer" || !token) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  return constantTimeCompare(token, authSecret)
}

/**
 * Middleware function to check authentication.
 * Returns a 401 response if not authenticated.
 *
 * @param request - The incoming request
 * @returns NextResponse with 401 if not authenticated, null otherwise
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authError = requireAuth(request)
 *   if (authError) return authError
 *
 *   // ... rest of handler
 * }
 * ```
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  if (!isAuthenticated(request)) {
    logger.warn("Unauthorized API access attempt", {
      path: request.nextUrl.pathname,
      method: request.method,
    })
    return NextResponse.json(
      { error: "Unauthorized. Please provide a valid Bearer token." },
      { status: 401 }
    )
  }
  return null
}

/**
 * Constant-time string comparison to prevent timing attacks.
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Gets the authentication status message for documentation.
 *
 * @returns Status message
 */
export function getAuthStatus(): { enabled: boolean; message: string } {
  const authSecret = process.env.AUTH_SECRET_TOKEN

  if (!authSecret) {
    return {
      enabled: false,
      message: "Authentication is disabled. Set AUTH_SECRET_TOKEN to enable.",
    }
  }

  return {
    enabled: true,
    message: "Authentication is enabled. Use Bearer token in Authorization header.",
  }
}
