import { z } from "zod"
import { chatCompletionWithJson } from "../client"
import {
  COVER_LETTER_SYSTEM_PROMPT,
  createCoverLetterPrompt,
} from "../prompts/cover-letter"

// Zod schema for AI output validation
export const CoverLetterSchema = z.object({
  greeting: z.string(),
  openingParagraph: z.string(),
  bodyParagraphs: z.array(z.string()),
  closingParagraph: z.string(),
  signOff: z.string(),
})

export type CoverLetterOutput = z.infer<typeof CoverLetterSchema>

export interface CoverLetterProgress {
  stage: string
  message: string
  percentage: number
}

export interface CoverLetterOptions {
  resumeContent: string
  jobDescription: string
  companyName: string
  jobTitle: string
  tone: "formal" | "conversational" | "enthusiastic"
  length: "short" | "medium" | "long"

  // Optional analysis insights
  strengths?: Array<{ area: string; description: string }>
  skillGaps?: Array<{ skill: string; recommendation: string }>

  onProgress?: (progress: CoverLetterProgress) => void
}

export async function generateCoverLetter(
  options: CoverLetterOptions
): Promise<CoverLetterOutput> {
  const { onProgress } = options

  onProgress?.({
    stage: "preparing",
    message: "Preparing to generate cover letter...",
    percentage: 10,
  })

  const userPrompt = createCoverLetterPrompt(options)

  onProgress?.({
    stage: "generating",
    message: "AI is crafting your cover letter...",
    percentage: 30,
  })

  const rawOutput = await chatCompletionWithJson<unknown>(
    [
      { role: "system", content: COVER_LETTER_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    {
      maxTokens: 8000,
    }
  )

  onProgress?.({
    stage: "validating",
    message: "Validating and formatting...",
    percentage: 80,
  })

  const coverLetter = CoverLetterSchema.parse(rawOutput)

  onProgress?.({
    stage: "complete",
    message: "Cover letter generated!",
    percentage: 100,
  })

  return coverLetter
}

/**
 * Helper to compile structured content into full letter text
 */
export function compileCoverLetter(output: CoverLetterOutput): string {
  const parts = [
    output.greeting,
    "",
    output.openingParagraph,
    "",
    ...output.bodyParagraphs.flatMap(p => [p, ""]),
    output.closingParagraph,
    "",
    output.signOff,
  ]
  return parts.join("\n").trim()
}
