/**
 * URL validation utility with SSRF protection.
 *
 * Prevents Server-Side Request Forgery by:
 * - Blocking private/reserved IP ranges
 * - Blocking localhost and internal hostnames
 * - Only allowing HTTP/HTTPS protocols
 * - DNS resolution validation
 * - Response size limits
 */

import dns from "dns/promises"

// Private IP ranges (RFC 1918, RFC 5735, RFC 6598)
const PRIVATE_IP_RANGES = [
  // 10.0.0.0 - 10.255.255.255 (Class A private)
  { start: 167772160, end: 184549375 },
  // 172.16.0.0 - 172.31.255.255 (Class B private)
  { start: 2886729728, end: 2887778303 },
  // 192.168.0.0 - 192.168.255.255 (Class C private)
  { start: 3232235520, end: 3232301055 },
  // 127.0.0.0 - 127.255.255.255 (loopback)
  { start: 2130706432, end: 2147483647 },
  // 169.254.0.0 - 169.254.255.255 (link-local/APIPA)
  { start: 2851995648, end: 2852061183 },
  // 0.0.0.0 - 0.255.255.255 (current network)
  { start: 0, end: 16777215 },
  // 100.64.0.0 - 100.127.255.255 (Carrier-grade NAT)
  { start: 1681915904, end: 1686110207 },
  // 192.0.0.0 - 192.0.0.255 (IETF Protocol Assignments)
  { start: 3221225472, end: 3221225727 },
  // 192.0.2.0 - 192.0.2.255 (TEST-NET-1)
  { start: 3221225984, end: 3221226239 },
  // 198.51.100.0 - 198.51.100.255 (TEST-NET-2)
  { start: 3325256704, end: 3325256959 },
  // 203.0.113.0 - 203.0.113.255 (TEST-NET-3)
  { start: 3405803776, end: 3405804031 },
  // 224.0.0.0 - 239.255.255.255 (Multicast)
  { start: 3758096384, end: 4026531839 },
  // 240.0.0.0 - 255.255.255.255 (Reserved)
  { start: 4026531840, end: 4294967295 },
]

// Blocked hostnames
const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "metadata",
  "metadata.google.internal",
  "metadata.google",
  "169.254.169.254",
  "internal",
  "local",
  "localdomain",
]

// Cloud metadata endpoints
const CLOUD_METADATA_PATTERNS = [
  /^169\.254\.169\.254$/,
  /metadata\.google\.internal/i,
  /metadata\.google/i,
  /100\.100\.100\.200/, // Alibaba Cloud
  /192\.0\.0\.192/, // Oracle Cloud
]

export interface UrlValidationOptions {
  /** Maximum content size in bytes (default: 5MB) */
  maxContentSize?: number
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number
  /** Allow only specific domains (optional allowlist) */
  allowedDomains?: string[]
}

export interface ValidatedUrlResult {
  url: URL
  hostname: string
  resolvedIps: string[]
}

/**
 * Converts an IPv4 address string to a 32-bit integer
 */
function ipToInt(ip: string): number {
  const parts = ip.split(".").map(Number)
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
}

/**
 * Checks if an IP address is in a private/reserved range
 */
function isPrivateIp(ip: string): boolean {
  // Handle IPv6 localhost
  if (ip === "::1" || ip === "::ffff:127.0.0.1") {
    return true
  }

  // Handle IPv4
  const ipInt = ipToInt(ip)
  return PRIVATE_IP_RANGES.some(range => ipInt >= range.start && ipInt <= range.end)
}

/**
 * Checks if a hostname matches blocked patterns
 */
function isBlockedHostname(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase()

  // Check exact matches and suffixes
  if (BLOCKED_HOSTNAMES.some(blocked =>
    lowerHostname === blocked ||
    lowerHostname.endsWith(`.${blocked}`)
  )) {
    return true
  }

  // Check cloud metadata patterns
  if (CLOUD_METADATA_PATTERNS.some(pattern => pattern.test(hostname))) {
    return true
  }

  return false
}

/**
 * Validates a URL for SSRF protection.
 *
 * @param urlString - The URL to validate
 * @param options - Validation options
 * @returns Validated URL information
 * @throws Error if URL is invalid or points to a restricted resource
 *
 * @example
 * ```typescript
 * try {
 *   const result = await validateUrl("https://example.com/job")
 *   console.log(`Safe to fetch: ${result.hostname}`)
 * } catch (error) {
 *   console.error(`Blocked URL: ${error.message}`)
 * }
 * ```
 */
export async function validateUrl(
  urlString: string,
  options: UrlValidationOptions = {}
): Promise<ValidatedUrlResult> {
  const { allowedDomains } = options

  // Parse URL
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    throw new Error("Invalid URL format")
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS protocols are allowed")
  }

  // Check for blocked hostnames
  if (isBlockedHostname(url.hostname)) {
    throw new Error("Access to internal or metadata endpoints is not allowed")
  }

  // Check allowlist if provided
  if (allowedDomains && allowedDomains.length > 0) {
    const isAllowed = allowedDomains.some(domain =>
      url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    )
    if (!isAllowed) {
      throw new Error(`Domain ${url.hostname} is not in the allowed list`)
    }
  }

  // Resolve DNS and check for private IPs
  let resolvedIps: string[] = []
  try {
    // Try IPv4 first
    resolvedIps = await dns.resolve4(url.hostname)
  } catch {
    // If IPv4 fails, try IPv6
    try {
      resolvedIps = await dns.resolve6(url.hostname)
    } catch {
      // DNS resolution failed - this could be intentional blocking or a real error
      throw new Error(`DNS resolution failed for ${url.hostname}`)
    }
  }

  // Check all resolved IPs for private ranges
  for (const ip of resolvedIps) {
    if (isPrivateIp(ip)) {
      throw new Error("URL resolves to a private or reserved IP address")
    }
  }

  return {
    url,
    hostname: url.hostname,
    resolvedIps,
  }
}

/**
 * Fetches a URL with SSRF protection.
 *
 * @param urlString - The URL to fetch
 * @param options - Validation and fetch options
 * @returns The fetch Response object
 * @throws Error if URL is invalid, blocked, or fetch fails
 *
 * @example
 * ```typescript
 * try {
 *   const response = await safeFetch("https://example.com/job", {
 *     timeout: 10000,
 *     maxContentSize: 1024 * 1024, // 1MB
 *   })
 *   const html = await response.text()
 * } catch (error) {
 *   console.error(`Fetch failed: ${error.message}`)
 * }
 * ```
 */
export async function safeFetch(
  urlString: string,
  options: UrlValidationOptions & RequestInit = {}
): Promise<Response> {
  const {
    maxContentSize = 5 * 1024 * 1024, // 5MB default
    timeout = 30000, // 30s default
    allowedDomains,
    ...fetchOptions
  } = options

  // Validate URL first
  await validateUrl(urlString, { allowedDomains })

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(urlString, {
      ...fetchOptions,
      signal: controller.signal,
    })

    // Check content-length header
    const contentLength = response.headers.get("content-length")
    if (contentLength) {
      const size = parseInt(contentLength, 10)
      if (size > maxContentSize) {
        throw new Error(`Response too large: ${size} bytes exceeds ${maxContentSize} byte limit`)
      }
    }

    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Reads response body with size limit.
 *
 * @param response - The fetch Response object
 * @param maxSize - Maximum size in bytes
 * @returns The response text
 * @throws Error if response exceeds size limit
 */
export async function readResponseWithLimit(
  response: Response,
  maxSize: number = 5 * 1024 * 1024
): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("No response body")
  }

  const chunks: Uint8Array[] = []
  let totalSize = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalSize += value.length
      if (totalSize > maxSize) {
        throw new Error(`Response too large: exceeds ${maxSize} byte limit`)
      }

      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  // Combine chunks and decode
  const combined = new Uint8Array(totalSize)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.length
  }

  return new TextDecoder().decode(combined)
}
