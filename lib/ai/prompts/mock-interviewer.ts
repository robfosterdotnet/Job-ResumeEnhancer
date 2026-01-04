/**
 * Mock Interviewer AI Prompts
 *
 * Scoring Rubric (0-100):
 * - Relevance to question: 25%
 * - Use of specific examples (STAR method): 25%
 * - Clarity and structure: 20%
 * - Technical accuracy: 20%
 * - Communication effectiveness: 10%
 */

export const MOCK_INTERVIEWER_SYSTEM_PROMPT = `You are an experienced technical interviewer conducting a realistic mock interview. Your role is to:

1. Ask questions in a professional, conversational tone
2. Listen to answers and provide constructive feedback
3. Generate relevant follow-up questions based on responses
4. Evaluate answers fairly using the STAR method criteria
5. Help the candidate improve their interview skills

You must respond with valid JSON matching the requested schema for each action type.

Scoring Guidelines (0-100 scale):
- 0-20: Poor - Answer is off-topic, irrelevant, or shows lack of understanding
- 21-40: Below Average - Partially addresses the question but lacks depth or examples
- 41-60: Average - Addresses the question adequately but could use more specifics
- 61-80: Good - Strong answer with relevant examples and clear structure
- 81-100: Excellent - Outstanding answer demonstrating expertise, great examples, and clear communication

Evaluation Criteria Weights:
- Relevance to question: 25%
- Use of specific examples (STAR method): 25%
- Clarity and structure: 20%
- Technical accuracy: 20%
- Communication effectiveness: 10%

STAR Method Evaluation:
- Situation: Did they set the context clearly?
- Task: Did they explain their specific responsibility?
- Action: Did they describe the actions they took?
- Result: Did they share measurable outcomes?

Be encouraging but honest. Focus on helping the candidate improve.`

export const EVALUATE_ANSWER_SCHEMA = `{
  "score": number (0-100),
  "feedback": string (2-4 sentences of constructive feedback),
  "suggestedImprovement": string (specific advice for improvement),
  "keyPointsCovered": string[] (key aspects the answer addressed well),
  "keyPointsMissed": string[] (important points that were missed or could be stronger),
  "starAnalysis": {
    "situation": boolean (was context provided),
    "task": boolean (was responsibility explained),
    "action": boolean (were actions described),
    "result": boolean (were outcomes shared)
  }
}`

export const GENERATE_FOLLOW_UP_SCHEMA = `{
  "shouldFollowUp": boolean,
  "followUpQuestion": string | null (the follow-up question to ask, or null if no follow-up),
  "reason": string (why this follow-up is relevant)
}`

export const SESSION_SUMMARY_SCHEMA = `{
  "overallScore": number (0-100, weighted average),
  "summaryFeedback": string (3-5 sentence overall assessment),
  "strengthAreas": string[] (top 3 areas where candidate excelled),
  "improvementAreas": string[] (top 3 areas needing work),
  "categoryScores": {
    "behavioral": number | null,
    "technical": number | null,
    "situational": number | null,
    "companySpecific": number | null,
    "roleSpecific": number | null
  },
  "recommendations": string[] (3-5 specific practice recommendations)
}`

export function createEvaluateAnswerPrompt(
  question: string,
  category: string,
  difficulty: string,
  userAnswer: string,
  jobContext: string,
  resumeContext: string
): string {
  return `## Interview Context
Job Description:
${jobContext}

Candidate's Resume:
${resumeContext}

## Question
Category: ${category}
Difficulty: ${difficulty}
Question: ${question}

## Candidate's Answer
${userAnswer}

Please evaluate this interview answer and provide your assessment as a JSON object matching this schema:
${EVALUATE_ANSWER_SCHEMA}

Consider the job requirements and the candidate's background when evaluating. Be fair, constructive, and specific in your feedback.`
}

export function createFollowUpPrompt(
  question: string,
  category: string,
  userAnswer: string,
  evaluation: { score: number; feedback: string; keyPointsMissed: string[] },
  followUpCount: number
): string {
  return `## Original Question
Category: ${category}
Question: ${question}

## Candidate's Answer
${userAnswer}

## Initial Evaluation
Score: ${evaluation.score}
Feedback: ${evaluation.feedback}
Points that could be explored further: ${evaluation.keyPointsMissed.join(", ")}

## Follow-up Decision
Current follow-up count for this question: ${followUpCount}
Maximum allowed follow-ups: 2

Based on the answer and evaluation, determine if a follow-up question would be valuable.
Only suggest a follow-up if:
1. The answer was incomplete or raised interesting points worth exploring
2. We haven't already asked 2 follow-ups for this question
3. The follow-up would help assess the candidate's depth of knowledge

Respond with a JSON object matching this schema:
${GENERATE_FOLLOW_UP_SCHEMA}`
}

export function createSessionSummaryPrompt(
  responses: Array<{
    questionText: string
    questionCategory: string
    userAnswer: string
    score: number
    feedback: string
  }>,
  jobContext: string
): string {
  const responseSummary = responses
    .map(
      (r, i) =>
        `Question ${i + 1} (${r.questionCategory}): Score ${r.score}/100
Q: ${r.questionText}
A: ${r.userAnswer}
Feedback: ${r.feedback}`
    )
    .join("\n\n")

  return `## Job Context
${jobContext}

## Interview Responses
${responseSummary}

## Summary Request
Based on all the responses above, provide a comprehensive session summary as a JSON object matching this schema:
${SESSION_SUMMARY_SCHEMA}

Calculate category scores as averages of questions in each category. If a category has no questions, use null.
The overall score should be a weighted average considering question difficulty.
Provide actionable recommendations for improvement.`
}

export function createQuestionSelectionPrompt(
  availableQuestions: Array<{
    id: number
    question: string
    category: string
    difficulty: string
  }>,
  answeredQuestionIds: number[],
  performanceTrend: { category: string; avgScore: number }[],
  targetCount: number,
  selectedCategories: string[] | null,
  difficulty: "mixed" | "easy" | "medium" | "hard"
): string {
  const unansweredQuestions = availableQuestions.filter(
    (q) => !answeredQuestionIds.includes(q.id)
  )

  const filteredByCategory = selectedCategories
    ? unansweredQuestions.filter((q) => selectedCategories.includes(q.category))
    : unansweredQuestions

  const filteredByDifficulty =
    difficulty === "mixed"
      ? filteredByCategory
      : filteredByCategory.filter((q) => q.difficulty === difficulty)

  return `## Available Questions
${filteredByDifficulty.map((q) => `ID: ${q.id} | Category: ${q.category} | Difficulty: ${q.difficulty}\nQuestion: ${q.question}`).join("\n\n")}

## Performance Trend
${performanceTrend.map((p) => `${p.category}: ${p.avgScore.toFixed(1)}% average`).join("\n")}

## Selection Criteria
- Questions needed: ${targetCount}
- Difficulty preference: ${difficulty}
- Selected categories: ${selectedCategories ? selectedCategories.join(", ") : "All"}

Select ${targetCount} question IDs that would provide a balanced and challenging interview.
Prioritize weaker categories based on performance trend.

Respond with a JSON array of question IDs, e.g., [1, 5, 8, 12]`
}
