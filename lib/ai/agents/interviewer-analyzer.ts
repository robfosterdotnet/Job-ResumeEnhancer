import { z } from "zod"
import { chatCompletionWithJson } from "../client"
import {
  LinkedInProfile,
  formatProfileForAnalysis,
} from "@/lib/parsers/linkedin-parser"

// ============ UTILITY FUNCTIONS ============

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

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

const QuestionSchema = z.object({
  question: z.string(),
  why: z.string(),
  category: z.string(),
})

const SuggestedQuestionSchema = z.object({
  question: z.string(),
  purpose: z.string(),
})

const TalkingPointSchema = z.object({
  topic: z.string(),
  connection: z.string(),
})

export const InterviewerAnalysisSchema = z.object({
  expertiseAreas: z.array(z.string()),
  likelyInterviewFocus: z.enum(["technical", "behavioral", "culture", "mixed"]),
  questionsTheyMayAsk: z.array(QuestionSchema),
  suggestedQuestionsToAsk: z.array(SuggestedQuestionSchema),
  talkingPoints: z.array(TalkingPointSchema),
  interviewTips: z.array(z.string()),
})

export type InterviewerAnalysis = z.infer<typeof InterviewerAnalysisSchema>

// ============ PROGRESS INTERFACE ============

export interface InterviewerAnalysisProgress {
  stage: string
  message: string
  percentage: number
}

export interface InterviewerAnalyzerOptions {
  interviewerProfile: LinkedInProfile
  interviewerName: string
  interviewerRole?: string
  interviewRole?: "hiring_manager" | "technical" | "hr" | "peer" | "executive" | "other"
  candidateResume?: string
  jobDescription?: string
  onProgress?: (progress: InterviewerAnalysisProgress) => void
}

// ============ SYSTEM PROMPT ============

const SYSTEM_PROMPT = `You are an expert career coach and interview preparation specialist. Your task is to analyze an interviewer's LinkedIn profile and help a job candidate prepare specifically for meeting with this person.

Based on the interviewer's background, generate insights that help the candidate:
1. Understand what the interviewer likely cares about based on their experience
2. Anticipate the types of questions they might ask
3. Prepare relevant questions to ask them
4. Find common ground for building rapport
5. Approach the interview strategically

## ANALYSIS GUIDELINES

### Expertise Areas
- Identify 3-6 key areas where this person has deep expertise
- Consider their current role, past roles, and skills
- These inform what topics they'll likely probe on

### Likely Interview Focus
Based on their role in the interview:
- hiring_manager: Mix of behavioral, team fit, and role-specific questions
- technical: Deep technical questions, problem-solving, system design
- hr: Behavioral, culture fit, compensation discussions
- peer: Day-to-day collaboration, team dynamics, technical depth
- executive: Vision, leadership, strategic thinking

### Questions They May Ask
Generate 5-8 likely questions based on:
- Their expertise areas
- Their role in the interview process
- Their background and what they value
- Include why they'd ask each question

### Questions to Ask Them
Generate 4-6 thoughtful questions the candidate should ask:
- Tailored to this interviewer's background
- Show the candidate did their homework
- Genuinely useful for learning about the role/company

### Talking Points
Identify 3-5 potential conversation starters or common ground:
- Shared interests, industries, technologies
- Similar career paths or challenges
- Topics the interviewer clearly cares about

### Interview Tips
Provide 3-5 specific tips for this particular interviewer:
- How to approach them based on their style
- What to emphasize given their background
- What to avoid or be careful about

## OUTPUT FORMAT
Return ONLY valid JSON using camelCase keys:
{
  "expertiseAreas": string[],
  "likelyInterviewFocus": "technical" | "behavioral" | "culture" | "mixed",
  "questionsTheyMayAsk": [{ "question": string, "why": string, "category": string }],
  "suggestedQuestionsToAsk": [{ "question": string, "purpose": string }],
  "talkingPoints": [{ "topic": string, "connection": string }],
  "interviewTips": string[]
}

IMPORTANT: Use camelCase for ALL keys.`

// ============ MAIN FUNCTION ============

export async function analyzeInterviewer(
  options: InterviewerAnalyzerOptions
): Promise<InterviewerAnalysis> {
  const {
    interviewerProfile,
    interviewerName,
    interviewerRole,
    interviewRole,
    candidateResume,
    jobDescription,
    onProgress,
  } = options

  onProgress?.({
    stage: "preparing",
    message: "Preparing interviewer analysis...",
    percentage: 10,
  })

  // Format the interviewer's profile for analysis
  const formattedProfile = formatProfileForAnalysis(interviewerProfile)

  // Build the analysis prompt
  let prompt = `Analyze this interviewer's profile and generate interview preparation insights.

## INTERVIEWER INFORMATION

**Name:** ${interviewerName}
${interviewerRole ? `**Current Role:** ${interviewerRole}` : ""}
${interviewRole ? `**Their Role in Interview:** ${formatInterviewRole(interviewRole)}` : ""}

${formattedProfile}
`

  if (jobDescription) {
    prompt += `
## JOB THE CANDIDATE IS INTERVIEWING FOR
${jobDescription.slice(0, 2000)}
`
  }

  if (candidateResume) {
    prompt += `
## CANDIDATE'S BACKGROUND (for finding common ground)
${candidateResume.slice(0, 2000)}
`
  }

  prompt += `
## REQUIRED ANALYSIS

Based on this interviewer's background and role, provide:

1. **Expertise Areas** (3-6) - Key areas where they have deep knowledge that they may probe on

2. **Likely Interview Focus** - Will this be primarily technical, behavioral, culture-focused, or mixed?

3. **Questions They May Ask** (5-8) - Specific questions this interviewer is likely to ask based on:
   - Their expertise and what they care about
   - Their role in the interview process
   - The job requirements
   For each question, explain WHY they'd ask it and categorize it (technical/behavioral/situational/culture)

4. **Questions to Ask Them** (4-6) - Thoughtful questions tailored to this interviewer that:
   - Show the candidate researched them
   - Leverage their expertise for genuine insights
   - Build rapport

5. **Talking Points** (3-5) - Potential common ground or conversation starters based on:
   - Shared experiences, technologies, or interests
   - Their career path and what they value
   - Topics they're clearly passionate about

6. **Interview Tips** (3-5) - Specific advice for approaching this interviewer:
   - What to emphasize
   - How to build rapport
   - What to be prepared for

Return your analysis as valid JSON.`

  onProgress?.({
    stage: "analyzing",
    message: `Analyzing ${interviewerName}'s background...`,
    percentage: 30,
  })

  const rawResult = await chatCompletionWithJson<unknown>(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    { maxTokens: 6000 }
  )

  onProgress?.({
    stage: "validating",
    message: "Finalizing interview insights...",
    percentage: 80,
  })

  // Transform snake_case keys to camelCase (in case AI uses wrong format)
  const transformedResult = transformKeysToCamelCase(rawResult)

  const analysis = InterviewerAnalysisSchema.parse(transformedResult)

  onProgress?.({
    stage: "complete",
    message: "Analysis complete!",
    percentage: 100,
  })

  return analysis
}

// ============ HELPER FUNCTIONS ============

function formatInterviewRole(
  role: "hiring_manager" | "technical" | "hr" | "peer" | "executive" | "other"
): string {
  const roleLabels: Record<string, string> = {
    hiring_manager: "Hiring Manager",
    technical: "Technical Interviewer",
    hr: "HR / Recruiter",
    peer: "Peer / Team Member",
    executive: "Executive / Leadership",
    other: "Other",
  }
  return roleLabels[role] || role
}

/**
 * Get a summary of the analysis for display
 */
export function getAnalysisSummary(analysis: InterviewerAnalysis): {
  focusLabel: string
  questionCount: number
  topExpertise: string[]
} {
  const focusLabels: Record<string, string> = {
    technical: "Technical Focus",
    behavioral: "Behavioral Focus",
    culture: "Culture Fit Focus",
    mixed: "Mixed Focus",
  }

  return {
    focusLabel: focusLabels[analysis.likelyInterviewFocus] || "Mixed Focus",
    questionCount: analysis.questionsTheyMayAsk.length,
    topExpertise: analysis.expertiseAreas.slice(0, 3),
  }
}
