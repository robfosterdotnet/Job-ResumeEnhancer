import { z } from "zod"
import { chatCompletionWithJson } from "../client"

const CleanedJobDescriptionSchema = z.object({
  title: z.string(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  employmentType: z.string().nullable(),
  salary: z.string().nullable(),
  description: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(z.string()),
  niceToHave: z.array(z.string()),
  benefits: z.array(z.string()),
})

export type CleanedJobDescription = z.infer<typeof CleanedJobDescriptionSchema>

const SYSTEM_PROMPT = `You are a job description parser. Your task is to extract and format job posting information from raw web page content.

Extract ONLY the job-related content, ignoring:
- Website navigation and menus
- Footer content
- Related job listings
- Advertisements
- Cookie notices
- Company boilerplate (unless it's part of the actual job description)

Format the job description cleanly, preserving the important details while removing HTML artifacts and duplicate content.

Respond with a JSON object containing the extracted information.`

const USER_PROMPT_TEMPLATE = `Parse the following raw web page content and extract the job description information.

Raw Content:
---
{content}
---

Extract and return a JSON object with these fields:
- title: The job title (string)
- company: Company name if mentioned (string or null)
- location: Job location if mentioned (string or null)
- employmentType: Full-time, Part-time, Contract, etc. if mentioned (string or null)
- salary: Salary range if mentioned (string or null)
- description: A clean, well-formatted job description paragraph (string)
- responsibilities: Array of key responsibilities (array of strings, extract from numbered/bulleted lists)
- requirements: Array of required qualifications (array of strings)
- niceToHave: Array of preferred/nice-to-have qualifications (array of strings)
- benefits: Array of benefits if mentioned (array of strings)

Important:
- Remove duplicate content
- Remove website navigation, footer, and unrelated content
- Keep the formatting clean and readable
- If a field is not found, use null for nullable fields or empty arrays for array fields`

export async function cleanJobDescription(
  rawContent: string
): Promise<CleanedJobDescription> {
  const userPrompt = USER_PROMPT_TEMPLATE.replace("{content}", rawContent)

  const result = await chatCompletionWithJson<CleanedJobDescription>(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    { maxTokens: 4000 }
  )

  // Validate with Zod
  return CleanedJobDescriptionSchema.parse(result)
}

export function formatCleanedJobDescription(job: CleanedJobDescription): string {
  const sections: string[] = []

  // Title and basic info
  sections.push(`# ${job.title}`)

  const metadata: string[] = []
  if (job.company) metadata.push(`**Company:** ${job.company}`)
  if (job.location) metadata.push(`**Location:** ${job.location}`)
  if (job.employmentType) metadata.push(`**Type:** ${job.employmentType}`)
  if (job.salary) metadata.push(`**Salary:** ${job.salary}`)

  if (metadata.length > 0) {
    sections.push(metadata.join("\n"))
  }

  // Description
  if (job.description) {
    sections.push(`## Overview\n${job.description}`)
  }

  // Responsibilities
  if (job.responsibilities.length > 0) {
    sections.push(`## Responsibilities\n${job.responsibilities.map(r => `- ${r}`).join("\n")}`)
  }

  // Requirements
  if (job.requirements.length > 0) {
    sections.push(`## Requirements\n${job.requirements.map(r => `- ${r}`).join("\n")}`)
  }

  // Nice to have
  if (job.niceToHave.length > 0) {
    sections.push(`## Nice to Have\n${job.niceToHave.map(r => `- ${r}`).join("\n")}`)
  }

  // Benefits
  if (job.benefits.length > 0) {
    sections.push(`## Benefits\n${job.benefits.map(b => `- ${b}`).join("\n")}`)
  }

  return sections.join("\n\n")
}
