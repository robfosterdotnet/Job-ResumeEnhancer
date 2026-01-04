/**
 * Logger utility with environment-based log levels.
 *
 * Log levels (from most to least verbose):
 * - debug: Detailed debugging information
 * - info: General operational information
 * - warn: Warning messages for potentially problematic situations
 * - error: Error messages for failures
 *
 * Configure via LOG_LEVEL environment variable.
 * Production defaults to "warn", development defaults to "debug".
 */

type LogLevel = "debug" | "info" | "warn" | "error"

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel
  if (envLevel && levels[envLevel] !== undefined) {
    return envLevel
  }
  return process.env.NODE_ENV === "production" ? "warn" : "debug"
}

const LOG_LEVEL = getLogLevel()

function shouldLog(level: LogLevel): boolean {
  return levels[level] >= levels[LOG_LEVEL]
}

/**
 * Sanitizes a string for logging by truncating and removing potential PII.
 * Use this for user-provided content that shouldn't be logged in full.
 */
export function sanitizeForLog(text: string, maxLength = 50): string {
  if (!text) return ""

  // Truncate long strings
  let sanitized = text.length > maxLength ? text.slice(0, maxLength) + "..." : text

  // Remove email addresses
  sanitized = sanitized.replace(/\b[\w.+-]+@[\w.-]+\.\w+\b/g, "[email]")

  // Remove phone numbers (basic US format)
  sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[phone]")

  // Remove potential SSN patterns
  sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[ssn]")

  return sanitized
}

/**
 * Logger with environment-based log levels.
 *
 * @example
 * ```typescript
 * import { logger, sanitizeForLog } from "@/lib/utils/logger"
 *
 * logger.debug("Processing request", { id: 123 })
 * logger.info("User action completed")
 * logger.warn("Rate limit approaching", { remaining: 5 })
 * logger.error("Failed to fetch data", error)
 *
 * // For user content, use sanitizeForLog
 * logger.debug("Search query", { query: sanitizeForLog(userQuery) })
 * ```
 */
export const logger = {
  /**
   * Debug level - detailed debugging information.
   * Only logged in development or when LOG_LEVEL=debug.
   */
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog("debug")) {
      console.debug(`[DEBUG] ${message}`, meta ?? "")
    }
  },

  /**
   * Info level - general operational information.
   * Logged when LOG_LEVEL is debug or info.
   */
  info: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog("info")) {
      console.info(`[INFO] ${message}`, meta ?? "")
    }
  },

  /**
   * Warn level - warning messages for potentially problematic situations.
   * Default level in production.
   */
  warn: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog("warn")) {
      console.warn(`[WARN] ${message}`, meta ?? "")
    }
  },

  /**
   * Error level - error messages for failures.
   * Always logged unless LOG_LEVEL is set higher than error (which isn't possible).
   */
  error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    if (shouldLog("error")) {
      const errorMessage = error instanceof Error ? error.message : String(error ?? "")
      console.error(`[ERROR] ${message}`, errorMessage, meta ?? "")
    }
  },
}
