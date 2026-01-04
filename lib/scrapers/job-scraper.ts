import * as cheerio from "cheerio"
import { safeFetch, readResponseWithLimit } from "@/lib/utils/url-validator"

export interface ScrapedJobDescription {
  title?: string
  company?: string
  location?: string
  description: string
  requirements?: string[]
  responsibilities?: string[]
  benefits?: string[]
  rawHtml?: string
}

/**
 * Scrapes a job description from a URL with SSRF protection.
 *
 * @param url - The URL to scrape
 * @returns Parsed job description data
 * @throws Error if URL is blocked (SSRF protection) or fetch fails
 */
export async function scrapeJobUrl(url: string): Promise<ScrapedJobDescription> {
  try {
    const response = await safeFetch(url, {
      timeout: 30000, // 30s timeout
      maxContentSize: 5 * 1024 * 1024, // 5MB max
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
    }

    // Read response with size limit
    const html = await readResponseWithLimit(response, 5 * 1024 * 1024)
    return parseJobHtml(html)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    // Preserve SSRF-related error messages for the API to return appropriate status
    if (message.includes("private") || message.includes("internal") || message.includes("metadata") || message.includes("not allowed")) {
      throw new Error(`URL blocked: ${message}`)
    }
    throw new Error(`Failed to scrape job URL: ${message}`)
  }
}

export function parseJobHtml(html: string): ScrapedJobDescription {
  const $ = cheerio.load(html)

  // Remove script and style tags
  $("script, style, nav, header, footer, aside").remove()

  // Try to extract structured data
  const structuredData = $('script[type="application/ld+json"]').text()
  let jobData: Partial<ScrapedJobDescription> = {}

  if (structuredData) {
    try {
      const parsed = JSON.parse(structuredData)
      if (parsed["@type"] === "JobPosting") {
        jobData = {
          title: parsed.title,
          company: parsed.hiringOrganization?.name,
          location: parsed.jobLocation?.address?.addressLocality,
          description: parsed.description,
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  // Extract text content from common job description selectors
  const selectors = [
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[id*="job-description"]',
    '[class*="description"]',
    'article',
    'main',
    '.content',
    '#content',
  ]

  let description = jobData.description || ""

  if (!description) {
    for (const selector of selectors) {
      const element = $(selector).first()
      if (element.length) {
        description = element.text().trim()
        if (description.length > 200) break
      }
    }
  }

  // Fallback to body text if no specific content found
  if (!description || description.length < 200) {
    description = $("body").text().trim()
  }

  // Clean up the text
  description = description
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim()

  // Try to extract title from common selectors
  const title = jobData.title ||
    $('h1').first().text().trim() ||
    $('[class*="job-title"]').first().text().trim() ||
    $('[class*="jobTitle"]').first().text().trim()

  return {
    title: title || undefined,
    company: jobData.company,
    location: jobData.location,
    description,
    rawHtml: html,
  }
}
