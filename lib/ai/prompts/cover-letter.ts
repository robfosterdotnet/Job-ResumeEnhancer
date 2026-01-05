import type { CoverLetterOptions } from "../agents/cover-letter-generator"

export const COVER_LETTER_SYSTEM_PROMPT = `You are an expert career coach and professional writer specializing in compelling cover letters. Your task is to create a tailored cover letter that highlights the candidate's relevant experience and enthusiasm for the position.

You must respond with a valid JSON object matching this structure:
{
  "greeting": string,
  "openingParagraph": string,
  "bodyParagraphs": string[],
  "closingParagraph": string,
  "signOff": string
}

Guidelines:
1. The greeting should be professional (e.g., "Dear Hiring Manager," or "Dear [Company] Team,")
2. The opening paragraph should hook the reader and state the position being applied for
3. Body paragraphs should highlight relevant experience and skills from the resume that match the job requirements
4. The closing paragraph should express enthusiasm and include a call to action
5. The sign-off should be professional (e.g., "Best regards," or "Sincerely,")
6. Adapt your writing style to the specified tone (formal, conversational, or enthusiastic)
7. Adjust content depth based on specified length (short: 200-300 words, medium: 300-450 words, long: 450-600 words)
8. If strengths and skill gaps are provided, incorporate them naturally - highlight strengths and reframe gaps positively
9. Never fabricate experiences - only reference what's explicitly in the resume
10. Use specific examples and quantifiable achievements when available from the resume
11. Avoid clichés like "I am excited to apply" - be genuine and specific
12. Focus on what value the candidate brings to the company, not what they want from the job`

export function createCoverLetterPrompt(options: CoverLetterOptions): string {
  const lengthGuidance = {
    short: "Keep the letter concise (200-300 words total). Use 1 body paragraph focusing on the most relevant qualifications.",
    medium: "Write a moderate length letter (300-450 words total). Use 2-3 body paragraphs covering key qualifications and fit.",
    long: "Write a comprehensive letter (450-600 words total). Use 3-4 body paragraphs with detailed examples and thorough coverage.",
  }

  const toneGuidance = {
    formal: "Use formal, professional language. Avoid contractions and casual phrases. Maintain a traditional business letter tone.",
    conversational: "Use a warm but professional tone. Contractions are acceptable. Show personality while remaining appropriate for a business context.",
    enthusiastic: "Express genuine excitement and energy about the opportunity. Use dynamic, engaging language while remaining professional. Show passion for the role and company.",
  }

  let prompt = `## Resume Content:
${options.resumeContent}

## Job Description:
${options.jobDescription}

## Position Details:
- Company: ${options.companyName}
- Job Title: ${options.jobTitle}

## Writing Parameters:
- Tone: ${options.tone} - ${toneGuidance[options.tone]}
- Length: ${options.length} - ${lengthGuidance[options.length]}`

  if (options.strengths && options.strengths.length > 0) {
    prompt += `

## Candidate Strengths (from resume analysis - emphasize these):
${options.strengths.map(s => `- ${s.area}: ${s.description}`).join("\n")}`
  }

  if (options.skillGaps && options.skillGaps.length > 0) {
    prompt += `

## Areas to Address (skill gaps - acknowledge or reframe positively as growth areas):
${options.skillGaps.map(g => `- ${g.skill}: ${g.recommendation}`).join("\n")}`
  }

  prompt += `

Please generate a compelling cover letter following the specified parameters. Respond with valid JSON only, no markdown code blocks.`

  return prompt
}
