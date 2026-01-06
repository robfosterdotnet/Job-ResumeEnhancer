import { z } from "zod"
import { chatCompletionWithJson } from "../client"

// ============ UTILITY FUNCTIONS ============

/**
 * Convert snake_case to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Recursively transform all object keys from snake_case to camelCase
 */
function transformKeysToCamelCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(transformKeysToCamelCase)
  }

  if (typeof obj === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const camelKey = snakeToCamel(key)
      result[camelKey] = transformKeysToCamelCase(value)
    }
    return result
  }

  return obj
}

// ============ ZOD SCHEMAS ============

const HeadlineAnalysisSchema = z.object({
  currentScore: z.number().min(0).max(100),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
})

const SectionAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  rewrittenContent: z.string().nullable().default(null),
})

const SkillsAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  missingKeySkills: z.array(z.string()),
  irrelevantSkills: z.array(z.string()),
  skillsToHighlight: z.array(z.string()),
})

const CompletenessChecklistSchema = z.object({
  hasPhoto: z.boolean().nullable().default(null), // Can't detect from text
  hasHeadline: z.boolean(),
  hasSummary: z.boolean(),
  hasExperience: z.boolean(),
  hasEducation: z.boolean(),
  hasSkills: z.boolean(),
  hasCertifications: z.boolean(),
  hasCustomUrl: z.boolean().nullable().default(null),
})

export const LinkedInAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  overallSummary: z.string(),

  headlineAnalysis: HeadlineAnalysisSchema,
  summaryAnalysis: SectionAnalysisSchema,
  experienceAnalysis: SectionAnalysisSchema,
  skillsAnalysis: SkillsAnalysisSchema,

  suggestedHeadlines: z.array(z.string()).min(1).max(5),
  suggestedSummary: z.string(),
  keywordsToAdd: z.array(z.string()),

  completenessChecklist: CompletenessChecklistSchema,
})

export type LinkedInAnalysis = z.infer<typeof LinkedInAnalysisSchema>
export type HeadlineAnalysis = z.infer<typeof HeadlineAnalysisSchema>
export type SectionAnalysis = z.infer<typeof SectionAnalysisSchema>
export type SkillsAnalysis = z.infer<typeof SkillsAnalysisSchema>
export type CompletenessChecklist = z.infer<typeof CompletenessChecklistSchema>

// ============ PROGRESS INTERFACE ============

export interface LinkedInOptimizationProgress {
  stage: string
  message: string
  percentage: number
}

export interface LinkedInOptimizationOptions {
  profileContent: string
  targetRole?: string
  targetIndustry?: string
  jobDescription?: string // Optional: align with specific job
  onProgress?: (progress: LinkedInOptimizationProgress) => void
}

// ============ SYSTEM PROMPT ============

const SYSTEM_PROMPT = `You are a LinkedIn profile optimization expert with deep knowledge of recruiter search algorithms, personal branding, and career positioning.

Your task is to analyze LinkedIn profiles and provide actionable improvements to:
1. INCREASE VISIBILITY - Optimize for LinkedIn's search algorithm and recruiter searches
2. IMPROVE KEYWORD ALIGNMENT - Ensure profile matches target roles and industries
3. CREATE COMPELLING HEADLINES - Write attention-grabbing headlines that communicate value
4. OPTIMIZE SUMMARIES - Craft engaging About sections that tell a professional story
5. ENHANCE EXPERIENCE - Use action verbs and quantifiable achievements
6. FILL SKILL GAPS - Identify missing skills that recruiters search for

## ANALYSIS GUIDELINES

### Headline Analysis
- Should be keyword-rich but readable
- Include target role, key skill, and value proposition
- Avoid generic titles like "Seeking opportunities"
- Maximum 220 characters

### Summary/About Section Analysis
- Should hook readers in first 2 lines (visible in search results)
- Include relevant keywords naturally
- Tell a professional story with achievements
- End with a call to action
- Target 2,000+ characters for SEO

### Experience Analysis
- Use strong action verbs (led, developed, implemented, etc.)
- Include quantifiable achievements (%, $, #)
- Ensure job titles are searchable/common
- Include relevant keywords in descriptions

### Skills Analysis
- Identify industry-standard skills for target role
- Flag outdated or irrelevant skills
- Recommend skills that recruiters search for
- Order matters - most important skills first

## OUTPUT FORMAT
Return ONLY valid JSON using camelCase keys (NOT snake_case). Use this exact structure:
{
  "overallScore": number (0-100),
  "overallSummary": string,
  "headlineAnalysis": { "currentScore": number, "issues": string[], "suggestions": string[] },
  "summaryAnalysis": { "score": number, "strengths": string[], "improvements": string[], "rewrittenContent": string|null },
  "experienceAnalysis": { "score": number, "strengths": string[], "improvements": string[], "rewrittenContent": string|null },
  "skillsAnalysis": { "score": number, "missingKeySkills": string[], "irrelevantSkills": string[], "skillsToHighlight": string[] },
  "suggestedHeadlines": string[] (3-5 options),
  "suggestedSummary": string,
  "keywordsToAdd": string[],
  "completenessChecklist": { "hasPhoto": boolean|null, "hasHeadline": boolean, "hasSummary": boolean, "hasExperience": boolean, "hasEducation": boolean, "hasSkills": boolean, "hasCertifications": boolean, "hasCustomUrl": boolean|null }
}

IMPORTANT: Use camelCase for ALL keys (e.g., overallScore NOT overall_score, missingKeySkills NOT missing_key_skills).`

// ============ MAIN FUNCTION ============

export async function analyzeLinkedInProfile(
  options: LinkedInOptimizationOptions
): Promise<LinkedInAnalysis> {
  const {
    profileContent,
    targetRole,
    targetIndustry,
    jobDescription,
    onProgress,
  } = options

  onProgress?.({
    stage: "preparing",
    message: "Preparing profile analysis...",
    percentage: 10,
  })

  // Build the analysis prompt
  let prompt = `Analyze this LinkedIn profile and provide comprehensive optimization suggestions.

## PROFILE CONTENT
${profileContent}
`

  if (targetRole) {
    prompt += `\n## TARGET ROLE
${targetRole}
`
  }

  if (targetIndustry) {
    prompt += `\n## TARGET INDUSTRY
${targetIndustry}
`
  }

  if (jobDescription) {
    prompt += `\n## JOB DESCRIPTION TO ALIGN WITH
${jobDescription}
`
  }

  prompt += `
## REQUIRED ANALYSIS

Provide a comprehensive analysis including:

1. **Overall Score** (0-100) - How well optimized is this profile for ${targetRole || "professional visibility"}?

2. **Overall Summary** - A brief (2-3 sentence) executive summary of the profile's current state and top priority improvements.

3. **Headline Analysis**
   - Score the current headline (0-100)
   - List specific issues
   - Provide improvement suggestions

4. **Summary/About Section Analysis**
   - Score (0-100)
   - Identify strengths
   - List specific improvements needed
   - Provide a fully rewritten version optimized for ${targetRole || "the target role"}

5. **Experience Section Analysis**
   - Score (0-100)
   - Identify what's working well
   - List improvements needed
   - Note: Don't rewrite the entire section, just note patterns to improve

6. **Skills Analysis**
   - Score (0-100)
   - List missing key skills for ${targetRole || "the target role"} that should be added
   - List skills that may be irrelevant or outdated
   - List skills that should be highlighted/moved to top

7. **3-5 Suggested Headlines** - Provide ready-to-use alternatives that are:
   - Keyword-optimized for ${targetRole || "recruiters"}
   - Under 220 characters
   - Compelling and specific

8. **Suggested Summary** - A complete, ready-to-use About section that:
   - Hooks readers in the first 2 lines
   - Includes relevant keywords naturally
   - Tells a compelling professional story
   - Ends with a call to action
   - Is 1,500-2,000 characters

9. **Keywords to Add** - List 10-15 specific keywords/phrases this profile should include for better visibility in ${targetRole || "the target"} searches.

10. **Completeness Checklist** - Check what elements are present/missing.

Return your analysis as valid JSON.`

  onProgress?.({
    stage: "analyzing",
    message: "AI is analyzing your LinkedIn profile...",
    percentage: 30,
  })

  const rawResult = await chatCompletionWithJson<unknown>(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    { maxTokens: 10000 } // Large output needed for rewritten content
  )

  onProgress?.({
    stage: "validating",
    message: "Validating optimization suggestions...",
    percentage: 80,
  })

  // Transform snake_case keys to camelCase (in case AI uses wrong format)
  const transformedResult = transformKeysToCamelCase(rawResult)

  const analysis = LinkedInAnalysisSchema.parse(transformedResult)

  onProgress?.({
    stage: "complete",
    message: "Analysis complete!",
    percentage: 100,
  })

  return analysis
}

// ============ HELPER FUNCTIONS ============

/**
 * Calculate section scores from an analysis
 */
export function calculateSectionScores(analysis: LinkedInAnalysis): {
  headline: number
  summary: number
  experience: number
  skills: number
  completeness: number
  keywords: number
} {
  const completenessScore = calculateCompletenessScore(
    analysis.completenessChecklist
  )
  const keywordScore = Math.min(100, analysis.keywordsToAdd.length * 8) // More keywords to add = lower current score

  return {
    headline: analysis.headlineAnalysis.currentScore,
    summary: analysis.summaryAnalysis.score,
    experience: analysis.experienceAnalysis.score,
    skills: analysis.skillsAnalysis.score,
    completeness: completenessScore,
    keywords: 100 - keywordScore, // Invert - fewer missing keywords = higher score
  }
}

/**
 * Calculate completeness score from checklist
 */
export function calculateCompletenessScore(
  checklist: CompletenessChecklist
): number {
  const items = [
    checklist.hasHeadline,
    checklist.hasSummary,
    checklist.hasExperience,
    checklist.hasEducation,
    checklist.hasSkills,
    checklist.hasCertifications,
  ]

  const completed = items.filter(Boolean).length
  return Math.round((completed / items.length) * 100)
}
