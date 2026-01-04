import { z } from "zod"
import { chatCompletionWithJson } from "../client"
import {
  RESUME_ANALYSIS_SYSTEM_PROMPT,
  createResumeAnalysisPrompt,
} from "../prompts/resume-analysis"

// Zod schemas for validation
const StrengthSchema = z.object({
  area: z.string(),
  description: z.string(),
  relevanceScore: z.number().min(0).max(10),
})

const WeaknessSchema = z.object({
  area: z.string(),
  description: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  suggestion: z.string(),
})

const SkillGapSchema = z.object({
  skill: z.string(),
  required: z.boolean(),
  currentLevel: z.enum(["none", "beginner", "intermediate", "advanced"]),
  recommendation: z.string(),
})

const EnhancementSchema = z.object({
  section: z.string(),
  currentText: z.string().optional(),
  suggestedText: z.string(),
  reason: z.string(),
})

const InterviewQuestionSchema = z.object({
  question: z.string(),
  category: z.enum([
    "behavioral",
    "technical",
    "situational",
    "company-specific",
    "role-specific",
  ]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  suggestedAnswer: z.string(),
})

export const ResumeAnalysisSchema = z.object({
  fitScore: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(StrengthSchema),
  weaknesses: z.array(WeaknessSchema),
  skillGaps: z.array(SkillGapSchema),
  enhancements: z.array(EnhancementSchema),
  interviewQuestions: z.array(InterviewQuestionSchema),
  keywordsMatched: z.array(z.string()),
  keywordsMissing: z.array(z.string()),
})

export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>
export type Strength = z.infer<typeof StrengthSchema>
export type Weakness = z.infer<typeof WeaknessSchema>
export type SkillGap = z.infer<typeof SkillGapSchema>
export type Enhancement = z.infer<typeof EnhancementSchema>
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>

export interface AnalysisProgress {
  stage: string
  message: string
  percentage: number
}

export interface AnalysisOptions {
  resumeContent: string
  jobDescription: string
  onProgress?: (progress: AnalysisProgress) => void
}

export async function runResumeAnalysis(
  options: AnalysisOptions
): Promise<ResumeAnalysis> {
  const { resumeContent, jobDescription, onProgress } = options

  onProgress?.({
    stage: "preparing",
    message: "Preparing analysis...",
    percentage: 10,
  })

  const userPrompt = createResumeAnalysisPrompt(resumeContent, jobDescription)

  onProgress?.({
    stage: "analyzing",
    message: "AI is analyzing your resume...",
    percentage: 30,
  })

  const rawAnalysis = await chatCompletionWithJson<unknown>(
    [
      { role: "system", content: RESUME_ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    {
      maxTokens: 12000, // High value to account for model reasoning tokens + large JSON output
    }
  )

  onProgress?.({
    stage: "validating",
    message: "Validating results...",
    percentage: 80,
  })

  const analysis = ResumeAnalysisSchema.parse(rawAnalysis)

  onProgress?.({
    stage: "complete",
    message: "Analysis complete!",
    percentage: 100,
  })

  return analysis
}
