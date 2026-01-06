/**
 * Server-Sent Events (SSE) stream parsing utility
 *
 * Provides a consistent way to consume SSE streams across the application.
 */

export interface SSEEvent<T = unknown> {
  type: string
  [key: string]: T | string
}

export interface SSEOptions<T> {
  /**
   * Called for each parsed event from the stream
   */
  onEvent: (event: SSEEvent<T>) => void
  /**
   * Called when a parse error occurs (optional, errors are silently ignored by default)
   */
  onError?: (error: Error) => void
}

/**
 * Consumes a Server-Sent Events (SSE) stream from a Response object.
 * Parses each `data:` line as JSON and calls the onEvent callback.
 *
 * @param response - The fetch Response containing the SSE stream
 * @param options - Callbacks for handling events and errors
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/agents/analyzer', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 * })
 *
 * await consumeSSEStream(response, {
 *   onEvent: (event) => {
 *     if (event.type === 'progress') {
 *       setProgress(event.percentage)
 *     } else if (event.type === 'complete') {
 *       setResult(event.result)
 *     }
 *   },
 *   onError: (error) => console.warn('Parse error:', error),
 * })
 * ```
 */
export async function consumeSSEStream<T>(
  response: Response,
  options: SSEOptions<T>
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("No response body stream available")
  }

  const decoder = new TextDecoder()
  let buffer = ""

  const processLine = (line: string) => {
    if (line.startsWith("data: ")) {
      const data = line.slice(6)

      // Skip "[DONE]" marker
      if (data === "[DONE]") return

      try {
        const event = JSON.parse(data) as SSEEvent<T>
        options.onEvent(event)
      } catch {
        // Only call onError if provided, otherwise silently ignore parse errors
        if (options.onError) {
          options.onError(
            new Error(`Failed to parse SSE event: ${data.slice(0, 100)}`)
          )
        }
      }
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // Flush any remaining bytes from the decoder
        buffer += decoder.decode()
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        processLine(line)
      }
    }

    // Process any remaining content in the buffer after stream ends
    if (buffer.trim()) {
      processLine(buffer)
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Creates an abort-controllable SSE stream consumer.
 * Useful when you need to cancel the stream early.
 *
 * @param response - The fetch Response containing the SSE stream
 * @param options - Callbacks for handling events and errors
 * @param signal - Optional AbortSignal to cancel the stream
 *
 * @example
 * ```typescript
 * const controller = new AbortController()
 *
 * // Later: controller.abort() to cancel
 * await consumeSSEStreamWithAbort(response, { onEvent }, controller.signal)
 * ```
 */
export async function consumeSSEStreamWithAbort<T>(
  response: Response,
  options: SSEOptions<T>,
  signal?: AbortSignal
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("No response body stream available")
  }

  const decoder = new TextDecoder()
  let buffer = ""

  const processLine = (line: string) => {
    if (line.startsWith("data: ")) {
      const data = line.slice(6)

      // Skip "[DONE]" marker
      if (data === "[DONE]") return

      try {
        const event = JSON.parse(data) as SSEEvent<T>
        options.onEvent(event)
      } catch {
        if (options.onError) {
          options.onError(
            new Error(`Failed to parse SSE event: ${data.slice(0, 100)}`)
          )
        }
      }
    }
  }

  try {
    while (true) {
      // Check for abort
      if (signal?.aborted) {
        break
      }

      const { done, value } = await reader.read()

      if (done) {
        // Flush any remaining bytes from the decoder
        buffer += decoder.decode()
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        processLine(line)
      }
    }

    // Process any remaining content in the buffer after stream ends (unless aborted)
    if (!signal?.aborted && buffer.trim()) {
      processLine(buffer)
    }
  } finally {
    reader.releaseLock()
  }
}
