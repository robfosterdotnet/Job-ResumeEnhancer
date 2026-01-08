import { z } from "zod"
import { chatCompletionWithJson } from "../client"

export const QuickFitResultSchema = z.object({
  fitScore: z.number().min(0).max(100),
  summary: z.string(),
  topMatches: z.array(z.string()),
  topGaps: z.array(z.string()),
})

export type QuickFitResult = z.infer<typeof QuickFitResultSchema>

export interface QuickFitOptions {
  resumeContent: string
  jobTitle: string
  jobSnippet: string
  jobDescription?: string
}

const QUICK_FIT_SYSTEM_PROMPT = `You are a quick resume-job matcher. Provide a BRIEF assessment of how well a resume matches a job.

Respond with a JSON object:
{
  "fitScore": number (0-100),
  "summary": "1-2 sentence fit explanation",
  "topMatches": ["skill1", "skill2", "skill3"],
  "topGaps": ["missing1", "missing2", "missing3"]
}

Scoring guidelines:
- 80-100: Excellent match, meets most requirements
- 60-79: Good match, meets core requirements with some gaps
- 40-59: Partial match, has relevant skills but significant gaps
- 0-39: Poor match, missing most key requirements

Be concise. Focus only on key skills and requirements. List 3-5 items max for matches and gaps.`

function createQuickFitPrompt(
  resumeContent: string,
  jobTitle: string,
  jobInfo: string
): string {
  // Truncate resume for speed (keep first 3000 chars to capture key skills)
  const truncatedResume =
    resumeContent.length > 3000
      ? resumeContent.substring(0, 3000) + "\n...[truncated]"
      : resumeContent

  return `## Job: ${jobTitle}

${jobInfo}

## Resume (excerpt):
${truncatedResume}

Provide a quick fit assessment as JSON:`
}

export async function runQuickFitScore(
  options: QuickFitOptions
): Promise<QuickFitResult> {
  const { resumeContent, jobTitle, jobSnippet, jobDescription } = options

  const jobInfo = jobDescription || jobSnippet
  const userPrompt = createQuickFitPrompt(resumeContent, jobTitle, jobInfo)

  const rawResult = await chatCompletionWithJson<unknown>(
    [
      { role: "system", content: QUICK_FIT_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    {
      maxTokens: 1000,
    }
  )

  return QuickFitResultSchema.parse(rawResult)
}
