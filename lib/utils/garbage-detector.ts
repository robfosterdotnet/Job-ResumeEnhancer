/**
 * Garbage Content Detector
 *
 * Detects when scraped content is likely template/placeholder garbage
 * from JavaScript-heavy ATS platforms (BrassRing, Workday, Taleo, iCIMS).
 */

export interface GarbageDetectionResult {
  isGarbage: boolean
  confidence: "high" | "medium" | "low"
  reasons: string[]
  suggestManualPaste: boolean
}

// Known problematic ATS domains that are JavaScript-heavy
const PROBLEMATIC_ATS_DOMAINS = [
  "brassring.com",
  "workday.com",
  "taleo.net",
  "icims.com",
  "myworkdayjobs.com",
  "greenhouse.io",
  "lever.co",
  "smartrecruiters.com",
  "jobs.ashbyhq.com",
  "boards.greenhouse.io",
]

// Template syntax patterns that indicate unrendered JavaScript content
const TEMPLATE_PATTERNS = [
  // Angular/Vue/Handlebars double braces
  /\{\{[^}]+\}\}/g,
  // Django/Jinja2 template tags
  /\{%[^%]+%\}/g,
  // ASP.NET/EJS tags
  /<%[^%]+%>/g,
  // Angular directives
  /\bng-[a-z]+\b/gi,
  // Angular structural directives
  /\*ng(If|For|Switch|Class|Style)\b/gi,
  // Vue directives
  /\bv-(if|for|show|model|bind|on)\b/gi,
  // React JSX expressions (often leaked in template errors)
  /\{[a-zA-Z_$][a-zA-Z0-9_$]*\.[a-zA-Z_$][a-zA-Z0-9_$]*\(/g,
  // JavaScript variable placeholders
  /\$\{[^}]+\}/g,
  // Common placeholder patterns
  /\[FIRSTNAME\]|\[LASTNAME\]|\[COMPANY\]/gi,
]

// Content patterns that suggest the page didn't render properly
const UNRENDERED_CONTENT_PATTERNS = [
  // Loading states that got captured
  /loading\.\.\.|please wait|fetching data/gi,
  // JavaScript object notation in text
  /\bfunction\s*\([^)]*\)\s*\{/g,
  // Module imports/exports
  /\b(import|export)\s+(default\s+)?(function|class|const|let|var)\b/g,
  // React/Angular component syntax
  /\bcomponent\s*:\s*['"][^'"]+['"]/gi,
  // Webpack/bundler artifacts
  /__webpack_require__|webpackJsonp/gi,
]

// Minimum expected content length for a valid job description
const MIN_VALID_CONTENT_LENGTH = 200

// Threshold ratios for detection
const TEMPLATE_MARKER_THRESHOLD = 0.02 // 2% template markers = suspicious
const MIN_WORD_RATIO = 0.3 // At least 30% should be recognizable words

/**
 * Check if a URL belongs to a known problematic ATS domain
 */
export function isProblematicDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return PROBLEMATIC_ATS_DOMAINS.some(domain =>
      hostname.includes(domain) || hostname.endsWith(domain)
    )
  } catch {
    return false
  }
}

/**
 * Count template marker occurrences in content
 */
function countTemplateMarkers(content: string): number {
  let count = 0
  for (const pattern of TEMPLATE_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      count += matches.length
    }
  }
  return count
}

/**
 * Check for unrendered content patterns
 */
function hasUnrenderedContent(content: string): string[] {
  const found: string[] = []
  for (const pattern of UNRENDERED_CONTENT_PATTERNS) {
    if (pattern.test(content)) {
      found.push(pattern.source)
    }
  }
  return found
}

/**
 * Calculate the ratio of recognizable English words to total tokens
 */
function calculateWordRatio(content: string): number {
  // Simple heuristic: check if tokens look like words (letters only, 2-20 chars)
  const tokens = content.split(/\s+/).filter(t => t.length > 0)
  if (tokens.length === 0) return 0

  const wordPattern = /^[a-zA-Z]{2,20}$/
  const wordCount = tokens.filter(t => wordPattern.test(t)).length

  return wordCount / tokens.length
}

/**
 * Extract specific examples of garbage content for user messaging
 */
function extractGarbageExamples(content: string): string[] {
  const examples: string[] = []

  // Find template syntax examples
  const templateMatch = content.match(/\{\{[^}]{1,50}\}\}/)
  if (templateMatch) {
    examples.push(`Template code: "${templateMatch[0].slice(0, 40)}..."`)
  }

  // Find Angular directive examples
  const angularMatch = content.match(/\*ng(If|For)[^>\s]{0,30}/)
  if (angularMatch) {
    examples.push(`Angular directive: "${angularMatch[0]}"`)
  }

  return examples.slice(0, 2) // Limit to 2 examples
}

/**
 * Main detection function - analyzes content for garbage/template indicators
 */
export function detectGarbageContent(
  content: string,
  url?: string
): GarbageDetectionResult {
  const reasons: string[] = []
  let confidenceScore = 0

  // Check 1: Content too short
  if (content.length < MIN_VALID_CONTENT_LENGTH) {
    reasons.push("Content is too short to be a valid job description")
    confidenceScore += 30
  }

  // Check 2: Known problematic domain
  if (url && isProblematicDomain(url)) {
    reasons.push("URL is from a known JavaScript-heavy job site")
    confidenceScore += 20
  }

  // Check 3: Template marker ratio
  const templateMarkerCount = countTemplateMarkers(content)
  const templateRatio = templateMarkerCount / Math.max(content.length, 1)

  if (templateMarkerCount > 3 || templateRatio > TEMPLATE_MARKER_THRESHOLD) {
    reasons.push(`Found ${templateMarkerCount} template markers (e.g., {{...}}, ng-*, etc.)`)
    confidenceScore += templateMarkerCount > 10 ? 40 : 25
  }

  // Check 4: Unrendered JavaScript content
  const unrenderedPatterns = hasUnrenderedContent(content)
  if (unrenderedPatterns.length > 0) {
    reasons.push("Found unrendered JavaScript/template code")
    confidenceScore += 25
  }

  // Check 5: Word ratio (low ratio = lots of code/symbols)
  const wordRatio = calculateWordRatio(content)
  if (wordRatio < MIN_WORD_RATIO) {
    reasons.push("Content has unusually low ratio of readable text")
    confidenceScore += 20
  }

  // Check 6: Specific garbage patterns in title area (first 200 chars)
  const titleArea = content.slice(0, 200)
  if (/\{\{|\{\%|<%|ng-|\*ng/i.test(titleArea)) {
    reasons.push("Template syntax found in title/header area")
    confidenceScore += 30
  }

  // Determine confidence level
  let confidence: "high" | "medium" | "low"
  if (confidenceScore >= 60) {
    confidence = "high"
  } else if (confidenceScore >= 35) {
    confidence = "medium"
  } else {
    confidence = "low"
  }

  // Add example garbage if found
  const examples = extractGarbageExamples(content)
  if (examples.length > 0 && confidence !== "low") {
    reasons.push(...examples)
  }

  const isGarbage = confidenceScore >= 35 // Medium or high confidence

  return {
    isGarbage,
    confidence,
    reasons,
    suggestManualPaste: isGarbage,
  }
}

/**
 * Creates a user-friendly error message for garbage content detection
 */
export function createGarbageContentErrorMessage(
  result: GarbageDetectionResult,
  url?: string
): string {
  if (!result.isGarbage) {
    return ""
  }

  const domain = url ? new URL(url).hostname : "this job site"

  // Build a friendly, non-technical message
  const parts = [
    `This job posting couldn't be automatically extracted from ${domain}.`,
    "",
    "This often happens with modern job sites that load content dynamically.",
    "",
    "To add this job:",
    "1. Open the job posting in your browser",
    "2. Select and copy the job description text",
    "3. Use the \"Paste Text\" tab to paste it here",
  ]

  return parts.join("\n")
}

/**
 * Error class for garbage content detection
 */
export class GarbageContentError extends Error {
  public readonly detectionResult: GarbageDetectionResult
  public readonly url?: string

  constructor(result: GarbageDetectionResult, url?: string) {
    const message = createGarbageContentErrorMessage(result, url)
    super(message)
    this.name = "GarbageContentError"
    this.detectionResult = result
    this.url = url
  }
}
