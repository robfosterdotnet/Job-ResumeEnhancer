import { z } from "zod"
import { chatCompletionWithJson } from "../client"
import {
  MOCK_INTERVIEWER_SYSTEM_PROMPT,
  createEvaluateAnswerPrompt,
  createFollowUpPrompt,
  createSessionSummaryPrompt,
} from "../prompts/mock-interviewer"

// Zod schemas for validation
const StarAnalysisSchema = z.object({
  situation: z.boolean(),
  task: z.boolean(),
  action: z.boolean(),
  result: z.boolean(),
})

export const AnswerEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string(),
  suggestedImprovement: z.string(),
  keyPointsCovered: z.array(z.string()),
  keyPointsMissed: z.array(z.string()),
  starAnalysis: StarAnalysisSchema,
})

export const FollowUpDecisionSchema = z.object({
  shouldFollowUp: z.boolean(),
  followUpQuestion: z.string().nullable(),
  reason: z.string(),
})

const CategoryScoresSchema = z.object({
  behavioral: z.number().nullable(),
  technical: z.number().nullable(),
  situational: z.number().nullable(),
  companySpecific: z.number().nullable(),
  roleSpecific: z.number().nullable(),
})

export const SessionSummarySchema = z.object({
  overallScore: z.number().min(0).max(100),
  summaryFeedback: z.string(),
  strengthAreas: z.array(z.string()),
  improvementAreas: z.array(z.string()),
  categoryScores: CategoryScoresSchema,
  recommendations: z.array(z.string()),
})

// Type exports
export type AnswerEvaluation = z.infer<typeof AnswerEvaluationSchema>
export type FollowUpDecision = z.infer<typeof FollowUpDecisionSchema>
export type SessionSummary = z.infer<typeof SessionSummarySchema>
export type StarAnalysis = z.infer<typeof StarAnalysisSchema>

export interface InterviewQuestion {
  id?: number
  question: string
  category: "behavioral" | "technical" | "situational" | "company-specific" | "role-specific" | "follow-up"
  difficulty: "easy" | "medium" | "hard"
  suggestedAnswer?: string
}

export interface InterviewContext {
  jobDescription: string
  resumeContent: string
  companyName?: string
  jobTitle?: string
}

export interface ResponseRecord {
  questionText: string
  questionCategory: string
  userAnswer: string
  score: number
  feedback: string
}

/**
 * Evaluate a candidate's answer to an interview question
 */
export async function evaluateAnswer(
  question: InterviewQuestion,
  userAnswer: string,
  context: InterviewContext
): Promise<AnswerEvaluation> {
  const prompt = createEvaluateAnswerPrompt(
    question.question,
    question.category,
    question.difficulty,
    userAnswer,
    context.jobDescription,
    context.resumeContent
  )

  const rawEvaluation = await chatCompletionWithJson<unknown>(
    [
      { role: "system", content: MOCK_INTERVIEWER_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    {
      maxTokens: 6000, // High value to account for model reasoning tokens (observed: up to 2000 used)
    }
  )

  return AnswerEvaluationSchema.parse(rawEvaluation)
}

/**
 * Determine if a follow-up question should be asked and generate it
 */
export async function generateFollowUp(
  question: InterviewQuestion,
  userAnswer: string,
  evaluation: AnswerEvaluation,
  currentFollowUpCount: number
): Promise<FollowUpDecision> {
  // Don't allow more than 2 follow-ups per question
  if (currentFollowUpCount >= 2) {
    return {
      shouldFollowUp: false,
      followUpQuestion: null,
      reason: "Maximum follow-up count reached",
    }
  }

  const prompt = createFollowUpPrompt(
    question.question,
    question.category,
    userAnswer,
    {
      score: evaluation.score,
      feedback: evaluation.feedback,
      keyPointsMissed: evaluation.keyPointsMissed,
    },
    currentFollowUpCount
  )

  const rawDecision = await chatCompletionWithJson<unknown>(
    [
      { role: "system", content: MOCK_INTERVIEWER_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    {
      maxTokens: 6000, // High value to account for model reasoning tokens (observed: up to 2000 used)
    }
  )

  return FollowUpDecisionSchema.parse(rawDecision)
}

/**
 * Generate a comprehensive summary at the end of the interview session
 */
export async function generateSessionSummary(
  responses: ResponseRecord[],
  context: InterviewContext
): Promise<SessionSummary> {
  const prompt = createSessionSummaryPrompt(
    responses,
    context.jobDescription
  )

  const rawSummary = await chatCompletionWithJson<unknown>(
    [
      { role: "system", content: MOCK_INTERVIEWER_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    {
      maxTokens: 6000, // High value to account for model reasoning tokens (observed: up to 2000 used)
    }
  )

  return SessionSummarySchema.parse(rawSummary)
}

/**
 * Select the next question from available questions based on performance and settings
 */
export function selectNextQuestion(
  availableQuestions: InterviewQuestion[],
  answeredQuestionIds: Set<number>,
  categoryPerformance: Map<string, { total: number; count: number }>,
  settings: {
    selectedCategories: string[] | null
    difficulty: "mixed" | "easy" | "medium" | "hard"
  }
): InterviewQuestion | null {
  // Filter out already answered questions
  let candidates = availableQuestions.filter(
    (q) => q.id && !answeredQuestionIds.has(q.id)
  )

  // Filter by selected categories if specified
  if (settings.selectedCategories && settings.selectedCategories.length > 0) {
    candidates = candidates.filter((q) =>
      settings.selectedCategories!.includes(q.category)
    )
  }

  // Filter by difficulty if not mixed
  if (settings.difficulty !== "mixed") {
    const difficultyFiltered = candidates.filter(
      (q) => q.difficulty === settings.difficulty
    )
    // Fall back to all candidates if no questions match the difficulty
    if (difficultyFiltered.length > 0) {
      candidates = difficultyFiltered
    }
  }

  if (candidates.length === 0) {
    return null
  }

  // Prioritize weaker categories
  const weakCategories = Array.from(categoryPerformance.entries())
    .filter(([, perf]) => perf.count > 0)
    .sort((a, b) => (a[1].total / a[1].count) - (b[1].total / b[1].count))
    .map(([cat]) => cat)

  // Try to find a question from a weak category
  for (const weakCategory of weakCategories) {
    const weakCandidates = candidates.filter((q) => q.category === weakCategory)
    if (weakCandidates.length > 0) {
      return weakCandidates[Math.floor(Math.random() * weakCandidates.length)]
    }
  }

  // Otherwise, pick a random question
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/**
 * Update category performance tracking
 */
export function updateCategoryPerformance(
  performance: Map<string, { total: number; count: number }>,
  category: string,
  score: number
): void {
  const current = performance.get(category) || { total: 0, count: 0 }
  performance.set(category, {
    total: current.total + score,
    count: current.count + 1,
  })
}

/**
 * Calculate average scores by category from performance data
 */
export function calculateCategoryAverages(
  performance: Map<string, { total: number; count: number }>
): Record<string, number | null> {
  const categories = [
    "behavioral",
    "technical",
    "situational",
    "company-specific",
    "role-specific",
  ]

  const averages: Record<string, number | null> = {}

  for (const category of categories) {
    const data = performance.get(category)
    averages[category] = data && data.count > 0 ? data.total / data.count : null
  }

  return averages
}
