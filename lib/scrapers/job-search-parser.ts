import { v4 as uuidv4 } from "uuid"
import type { SearchResult } from "./search-client"

export interface ParsedJobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  snippet: string
  url: string
  source: string | null
  postedDate: string | null
}

const JOB_BOARD_PATTERNS: Record<string, RegExp> = {
  indeed: /indeed\.com/i,
  linkedin: /linkedin\.com\/jobs/i,
  glassdoor: /glassdoor\.com/i,
  ziprecruiter: /ziprecruiter\.com/i,
  monster: /monster\.com/i,
  dice: /dice\.com/i,
  careerbuilder: /careerbuilder\.com/i,
  simplyhired: /simplyhired\.com/i,
  builtin: /builtin\.com/i,
  wellfound: /wellfound\.com/i,
}

export function parseJobSearchResults(results: SearchResult[]): ParsedJobResult[] {
  return results
    .map((result) => parseJobResult(result))
    .filter((result): result is ParsedJobResult => result !== null)
}

function parseJobResult(result: SearchResult): ParsedJobResult | null {
  if (!isJobListing(result)) {
    return null
  }

  const { title, company, location } = extractJobMetadata(result.title, result.snippet)

  return {
    id: uuidv4(),
    title: title || cleanTitle(result.title),
    company,
    location,
    snippet: result.snippet,
    url: result.url,
    source: detectJobBoard(result.url),
    postedDate: extractPostedDate(result.snippet),
  }
}

function isJobListing(result: SearchResult): boolean {
  const jobKeywords = [
    "job",
    "career",
    "hiring",
    "position",
    "apply",
    "employment",
    "salary",
    "remote",
    "full-time",
    "part-time",
    "contract",
    "opportunity",
    "openings",
    "vacancy",
  ]
  const text = `${result.title} ${result.snippet}`.toLowerCase()

  const hasJobKeyword = jobKeywords.some((kw) => text.includes(kw))
  const isFromJobBoard = Object.values(JOB_BOARD_PATTERNS).some((pattern) =>
    pattern.test(result.url)
  )

  return hasJobKeyword || isFromJobBoard
}

function extractJobMetadata(
  title: string,
  snippet: string
): {
  title: string | null
  company: string | null
  location: string | null
} {
  // Common patterns in job titles:
  // "Job Title - Company - Location"
  // "Job Title at Company"
  // "Job Title | Company | Location"
  // "Company is hiring a Job Title"

  // Pattern: "X at Y - Z" or "X at Y"
  const atPattern = /^(.+?)\s+at\s+([^-|]+)(?:\s*[-|]\s*(.+))?$/i
  let match = title.match(atPattern)
  if (match) {
    return {
      title: cleanTitle(match[1]),
      company: cleanCompany(match[2]),
      location: match[3] ? cleanLocation(match[3]) : extractLocationFromSnippet(snippet),
    }
  }

  // Pattern: "X - Y - Z" (common on Indeed, LinkedIn)
  const dashPattern = /^(.+?)\s+-\s+([^-]+?)(?:\s+-\s+(.+))?$/
  match = title.match(dashPattern)
  if (match) {
    // Could be "Title - Company - Location" or "Title - Location"
    const second = match[2].trim()
    const third = match[3]?.trim()

    if (third && isLikelyLocation(third)) {
      return {
        title: cleanTitle(match[1]),
        company: cleanCompany(second),
        location: cleanLocation(third),
      }
    } else if (isLikelyLocation(second)) {
      return {
        title: cleanTitle(match[1]),
        company: null,
        location: cleanLocation(second),
      }
    } else {
      return {
        title: cleanTitle(match[1]),
        company: cleanCompany(second),
        location: third ? cleanLocation(third) : extractLocationFromSnippet(snippet),
      }
    }
  }

  // Pattern: "X | Y | Z"
  const pipePattern = /^(.+?)\s*\|\s*([^|]+?)(?:\s*\|\s*(.+))?$/
  match = title.match(pipePattern)
  if (match) {
    return {
      title: cleanTitle(match[1]),
      company: cleanCompany(match[2]),
      location: match[3] ? cleanLocation(match[3]) : extractLocationFromSnippet(snippet),
    }
  }

  // No pattern matched, try to extract location from snippet
  return {
    title: null,
    company: null,
    location: extractLocationFromSnippet(snippet),
  }
}

function extractLocationFromSnippet(snippet: string): string | null {
  const locationPatterns = [
    // "Location: City, ST" or "in City, ST"
    /(?:location:?|in)\s+([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/i,
    // "City, ST" pattern (US)
    /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?,\s*[A-Z]{2})\b/,
    // "Remote" keywords
    /\b(remote|work from home|wfh|hybrid)\b/i,
  ]

  for (const pattern of locationPatterns) {
    const match = snippet.match(pattern)
    if (match) {
      return cleanLocation(match[1])
    }
  }

  return null
}

function isLikelyLocation(text: string): boolean {
  const cleaned = text.trim().toLowerCase()

  // US state abbreviation pattern
  if (/,\s*[a-z]{2}$/i.test(cleaned)) return true

  // Remote/hybrid keywords
  if (/^(remote|hybrid|on-?site|work from home)$/i.test(cleaned)) return true

  // Common location words
  const locationWords = ["city", "county", "area", "metro", "region"]
  if (locationWords.some((word) => cleaned.includes(word))) return true

  return false
}

function detectJobBoard(url: string): string | null {
  for (const [name, pattern] of Object.entries(JOB_BOARD_PATTERNS)) {
    if (pattern.test(url)) {
      return name.charAt(0).toUpperCase() + name.slice(1)
    }
  }
  return null
}

function extractPostedDate(snippet: string): string | null {
  const datePatterns = [
    /(\d+\s*(?:day|hour|week|month)s?\s*ago)/i,
    /(posted\s+(?:today|yesterday|\d+\s*\w+\s*ago))/i,
    /(just\s+posted)/i,
    /(new)/i,
  ]

  for (const pattern of datePatterns) {
    const match = snippet.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }

  return null
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*[-|]\s*$/, "") // Remove trailing separators
    .replace(/^\s*[-|]\s*/, "") // Remove leading separators
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
}

function cleanCompany(company: string): string {
  return company
    .replace(/\s*[-|]\s*$/, "")
    .replace(/^\s*[-|]\s*/, "")
    .replace(/\s+/g, " ")
    .trim()
}

function cleanLocation(location: string): string {
  return location
    .replace(/\s*[-|]\s*$/, "")
    .replace(/^\s*[-|]\s*/, "")
    .replace(/\s+/g, " ")
    .trim()
}
