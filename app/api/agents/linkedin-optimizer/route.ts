import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  linkedInProfiles,
  linkedInAnalyses,
  jobApplications,
} from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import {
  analyzeLinkedInProfile,
  calculateSectionScores,
} from "@/lib/ai/agents/linkedin-optimizer"
import { requireAuth } from "@/lib/auth/middleware"
import {
  parseLinkedInText,
  formatProfileForAnalysis,
} from "@/lib/parsers/linkedin-parser"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Increase timeout for long-running AI analysis (5 minutes)
export const maxDuration = 300

// POST /api/agents/linkedin-optimizer - Analyze a LinkedIn profile
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      profileContent,
      targetRole,
      targetIndustry,
      jobApplicationId,
      profileId,
    } = body

    if (!profileContent || typeof profileContent !== "string") {
      return NextResponse.json(
        { error: "Profile content is required" },
        { status: 400 }
      )
    }

    // Parse the LinkedIn profile content
    const parsedProfile = parseLinkedInText(profileContent)
    const formattedContent = formatProfileForAnalysis(parsedProfile)

    // Get job description if jobApplicationId is provided
    let jobDescription: string | undefined
    if (jobApplicationId) {
      const job = await db.query.jobApplications.findFirst({
        where: eq(jobApplications.id, jobApplicationId),
      })
      if (job) {
        jobDescription = job.jobDescriptionText
      }
    }

    // Save or update the LinkedIn profile
    let linkedInProfileId: number

    if (profileId) {
      // Update existing profile
      await db
        .update(linkedInProfiles)
        .set({
          fullName: parsedProfile.fullName,
          headline: parsedProfile.headline,
          summary: parsedProfile.summary,
          location: parsedProfile.location,
          experienceJson: JSON.stringify(parsedProfile.experience),
          educationJson: JSON.stringify(parsedProfile.education),
          skillsJson: JSON.stringify(parsedProfile.skills),
          certificationsJson: JSON.stringify(parsedProfile.certifications),
          rawContent: profileContent,
          updatedAt: new Date(),
        })
        .where(eq(linkedInProfiles.id, profileId))
      linkedInProfileId = profileId
    } else {
      // Create new profile
      const [newProfile] = await db
        .insert(linkedInProfiles)
        .values({
          fullName: parsedProfile.fullName,
          headline: parsedProfile.headline,
          summary: parsedProfile.summary,
          location: parsedProfile.location,
          experienceJson: JSON.stringify(parsedProfile.experience),
          educationJson: JSON.stringify(parsedProfile.education),
          skillsJson: JSON.stringify(parsedProfile.skills),
          certificationsJson: JSON.stringify(parsedProfile.certifications),
          rawContent: profileContent,
        })
        .returning()
      linkedInProfileId = newProfile.id
    }

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const analysis = await analyzeLinkedInProfile({
            profileContent: formattedContent,
            targetRole,
            targetIndustry,
            jobDescription,
            onProgress: (progress) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "progress", ...progress })}\n\n`
                )
              )
            },
          })

          // Calculate section scores
          const sectionScores = calculateSectionScores(analysis)

          // Save analysis to database
          const [savedAnalysis] = await db
            .insert(linkedInAnalyses)
            .values({
              linkedInProfileId,
              jobApplicationId: jobApplicationId || null,
              targetRole: targetRole || null,
              targetIndustry: targetIndustry || null,
              overallScore: analysis.overallScore,
              headlineScore: sectionScores.headline,
              summaryScore: sectionScores.summary,
              experienceScore: sectionScores.experience,
              skillsScore: sectionScores.skills,
              completenessScore: sectionScores.completeness,
              keywordScore: sectionScores.keywords,
              overallSummary: analysis.overallSummary,
              headlineAnalysisJson: JSON.stringify(analysis.headlineAnalysis),
              summaryAnalysisJson: JSON.stringify(analysis.summaryAnalysis),
              experienceAnalysisJson: JSON.stringify(analysis.experienceAnalysis),
              skillsAnalysisJson: JSON.stringify(analysis.skillsAnalysis),
              suggestedHeadlinesJson: JSON.stringify(analysis.suggestedHeadlines),
              suggestedSummary: analysis.suggestedSummary,
              suggestedSkillsJson: JSON.stringify(
                analysis.skillsAnalysis.skillsToHighlight
              ),
              keywordsToAddJson: JSON.stringify(analysis.keywordsToAdd),
              completenessChecklistJson: JSON.stringify(
                analysis.completenessChecklist
              ),
              rawResponseJson: JSON.stringify(analysis),
            })
            .returning()

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                analysisId: savedAnalysis.id,
                profileId: linkedInProfileId,
                analysis,
                sectionScores,
              })}\n\n`
            )
          )
          controller.close()
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : "Unknown error",
              })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error analyzing LinkedIn profile:", error)
    return NextResponse.json(
      { error: "Failed to analyze LinkedIn profile" },
      { status: 500 }
    )
  }
}

// GET /api/agents/linkedin-optimizer?profileId=X - Get analysis results
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const profileId = searchParams.get("profileId")
    const jobApplicationId = searchParams.get("jobApplicationId")

    if (!profileId && !jobApplicationId) {
      return NextResponse.json(
        { error: "Profile ID or Job Application ID is required" },
        { status: 400 }
      )
    }

    let analyses
    if (profileId) {
      analyses = await db.query.linkedInAnalyses.findMany({
        where: eq(linkedInAnalyses.linkedInProfileId, parseInt(profileId, 10)),
        orderBy: [desc(linkedInAnalyses.createdAt)],
      })
    } else if (jobApplicationId) {
      analyses = await db.query.linkedInAnalyses.findMany({
        where: eq(
          linkedInAnalyses.jobApplicationId,
          parseInt(jobApplicationId, 10)
        ),
        orderBy: [desc(linkedInAnalyses.createdAt)],
      })
    }

    return NextResponse.json({ analyses })
  } catch (error) {
    console.error("Error fetching LinkedIn analyses:", error)
    return NextResponse.json(
      { error: "Failed to fetch LinkedIn analyses" },
      { status: 500 }
    )
  }
}
