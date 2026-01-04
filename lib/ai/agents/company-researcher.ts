import { z } from "zod"
import { chatCompletionWithJson } from "../client"
import {
  COMPANY_RESEARCH_SYSTEM_PROMPT,
  createCompanyResearchPrompt,
} from "../prompts/company-research"
import { searchCompany, type SearchResult } from "@/lib/scrapers/search-client"

// Zod schemas for validation
const LeaderSchema = z.object({
  name: z.string(),
  title: z.string(),
  role: z.string(),
  bio: z.string().optional(),
})

const FinancialsSchema = z.object({
  isPublic: z.boolean().nullable().default(false),
  stockSymbol: z.string().optional().nullable(),
  revenue: z.string().optional().nullable(),
  marketCap: z.string().optional().nullable(),
  recentPerformance: z.string().optional().nullable(),
})

const CultureSchema = z.object({
  values: z.array(z.string()).default([]),
  workEnvironment: z.string().nullable().default("Information not available"),
  benefits: z.array(z.string()).optional(),
  glassdoorRating: z.number().optional().nullable(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
})

const NewsItemSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  date: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
})

const LegalIssueSchema = z.object({
  title: z.string(),
  description: z.string(),
  status: z.string(),
})

const EthicsAlignmentSchema = z.object({
  score: z.number().min(0).max(10).nullable().default(5),
  positiveFactors: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  recommendation: z.string().nullable().default("Insufficient information to provide a recommendation"),
})

// Default values for when AI returns null
const defaultEthicsAlignment = {
  score: 5,
  positiveFactors: [],
  concerns: [],
  recommendation: "Insufficient information to provide a recommendation",
}

const defaultCulture = {
  values: [],
  workEnvironment: "Information not available",
  benefits: [],
  glassdoorRating: null,
  pros: [],
  cons: [],
}

export const CompanyResearchSchema = z.object({
  overview: z.object({
    name: z.string(),
    industry: z.string().nullable().default("Unknown"),
    description: z.string().nullable().default("No description available"),
    headquarters: z.string().optional().nullable(),
    foundedYear: z.number().optional().nullable(),
    employeeCount: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    // Core business fields expected by the UI
    products: z.string().optional().nullable(),
    targetMarket: z.string().optional().nullable(),
    competitiveAdvantage: z.string().optional().nullable(),
  }),
  leadership: z.array(LeaderSchema).default([]),
  financials: FinancialsSchema.optional().nullable(),
  culture: CultureSchema.nullable().transform(v => v ?? defaultCulture),
  recentNews: z.array(NewsItemSchema).default([]),
  legalIssues: z.array(LegalIssueSchema).optional().nullable(),
  ethicsAlignment: EthicsAlignmentSchema.nullable().transform(v => v ?? defaultEthicsAlignment),
})

export type CompanyResearch = z.infer<typeof CompanyResearchSchema>
export type Leader = z.infer<typeof LeaderSchema>
export type Financials = z.infer<typeof FinancialsSchema>
export type Culture = z.infer<typeof CultureSchema>
export type NewsItem = z.infer<typeof NewsItemSchema>
export type LegalIssue = z.infer<typeof LegalIssueSchema>
export type EthicsAlignment = z.infer<typeof EthicsAlignmentSchema>

export interface ResearchProgress {
  stage: string
  message: string
  percentage: number
}

export interface ResearchOptions {
  companyName: string
  jobTitle?: string
  onProgress?: (progress: ResearchProgress) => void
}

function formatSearchResults(results: Record<string, SearchResult[]>): string {
  let formatted = ""

  for (const [category, items] of Object.entries(results)) {
    formatted += `\n### ${category.charAt(0).toUpperCase() + category.slice(1)} Results:\n`
    for (const item of items) {
      formatted += `\n**${item.title}**\nURL: ${item.url}\n${item.snippet}\n---\n`
    }
  }

  return formatted
}

export async function runCompanyResearch(
  options: ResearchOptions
): Promise<CompanyResearch> {
  const { companyName, jobTitle, onProgress } = options

  onProgress?.({
    stage: "searching",
    message: `Searching for information about ${companyName}...`,
    percentage: 10,
  })

  // Perform web searches
  const searchResults = await searchCompany(companyName)

  onProgress?.({
    stage: "processing",
    message: "Processing search results...",
    percentage: 40,
  })

  // Format search results for the AI
  const formattedResults = formatSearchResults(searchResults)

  onProgress?.({
    stage: "analyzing",
    message: "AI is analyzing company data...",
    percentage: 60,
  })

  const userPrompt = createCompanyResearchPrompt(
    companyName,
    formattedResults,
    jobTitle
  )

  const rawResearch = await chatCompletionWithJson<unknown>(
    [
      { role: "system", content: COMPANY_RESEARCH_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    {
      maxTokens: 12000, // High value to account for model reasoning tokens + large JSON output
    }
  )

  onProgress?.({
    stage: "validating",
    message: "Validating research...",
    percentage: 90,
  })

  const research = CompanyResearchSchema.parse(rawResearch)

  onProgress?.({
    stage: "complete",
    message: "Research complete!",
    percentage: 100,
  })

  return research
}
