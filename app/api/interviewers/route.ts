import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { interviewerProfiles, jobApplications } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"
import { parseLinkedInText } from "@/lib/parsers/linkedin-parser"
import { analyzeInterviewer } from "@/lib/ai/agents/interviewer-analyzer"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Increase timeout for long-running AI analysis (5 minutes)
export const maxDuration = 300

// GET /api/interviewers?jobId=X - List all interviewers for a job
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get("jobId")

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      )
    }

    const interviewers = await db.query.interviewerProfiles.findMany({
      where: eq(interviewerProfiles.jobApplicationId, parseInt(jobId, 10)),
      orderBy: [desc(interviewerProfiles.createdAt)],
    })

    return NextResponse.json({ interviewers })
  } catch (error) {
    console.error("Error fetching interviewers:", error)
    return NextResponse.json(
      { error: "Failed to fetch interviewers" },
      { status: 500 }
    )
  }
}

// POST /api/interviewers - Create interviewer and analyze
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      jobApplicationId,
      name,
      role,
      interviewRole,
      linkedInUrl,
      linkedInContent,
    } = body

    if (!jobApplicationId || !name) {
      return NextResponse.json(
        { error: "Job application ID and name are required" },
        { status: 400 }
      )
    }

    // Get job application for context
    const job = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.id, jobApplicationId),
      with: {
        resume: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Parse LinkedIn content if provided
    let parsedProfile = null
    if (linkedInContent && typeof linkedInContent === "string") {
      parsedProfile = parseLinkedInText(linkedInContent)
    }

    // Create the interviewer profile record
    const [interviewer] = await db
      .insert(interviewerProfiles)
      .values({
        jobApplicationId,
        name,
        role: role || parsedProfile?.headline || null,
        interviewRole: interviewRole || null,
        linkedInUrl: linkedInUrl || null,
        headline: parsedProfile?.headline || null,
        summary: parsedProfile?.summary || null,
        location: parsedProfile?.location || null,
        experienceJson: parsedProfile
          ? JSON.stringify(parsedProfile.experience)
          : null,
        educationJson: parsedProfile
          ? JSON.stringify(parsedProfile.education)
          : null,
        skillsJson: parsedProfile ? JSON.stringify(parsedProfile.skills) : null,
        rawLinkedInContent: linkedInContent || null,
        analysisStatus: linkedInContent ? "analyzing" : "pending",
      })
      .returning()

    // If no LinkedIn content, return without analysis
    if (!linkedInContent || !parsedProfile) {
      return NextResponse.json({
        interviewer,
        message: "Interviewer added. Add LinkedIn profile for AI analysis.",
      })
    }

    // Stream the AI analysis
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const analysis = await analyzeInterviewer({
            interviewerProfile: parsedProfile!,
            interviewerName: name,
            interviewerRole: role || parsedProfile!.headline,
            interviewRole: interviewRole,
            candidateResume: job.resume?.parsedContent || undefined,
            jobDescription: job.jobDescriptionText,
            onProgress: (progress) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "progress", ...progress })}\n\n`
                )
              )
            },
          })

          // Update the interviewer profile with analysis results
          const [updatedInterviewer] = await db
            .update(interviewerProfiles)
            .set({
              expertiseAreasJson: JSON.stringify(analysis.expertiseAreas),
              likelyInterviewFocus: analysis.likelyInterviewFocus,
              questionsTheyMayAskJson: JSON.stringify(
                analysis.questionsTheyMayAsk
              ),
              suggestedQuestionsToAskJson: JSON.stringify(
                analysis.suggestedQuestionsToAsk
              ),
              talkingPointsJson: JSON.stringify(analysis.talkingPoints),
              interviewTipsJson: JSON.stringify(analysis.interviewTips),
              analysisStatus: "completed",
              rawResponseJson: JSON.stringify(analysis),
              updatedAt: new Date(),
            })
            .where(eq(interviewerProfiles.id, interviewer.id))
            .returning()

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                interviewer: updatedInterviewer,
                analysis,
              })}\n\n`
            )
          )
          controller.close()
        } catch (error) {
          // Update status to failed
          await db
            .update(interviewerProfiles)
            .set({
              analysisStatus: "failed",
              updatedAt: new Date(),
            })
            .where(eq(interviewerProfiles.id, interviewer.id))

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                interviewerId: interviewer.id,
                error: error instanceof Error ? error.message : "Analysis failed",
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
    console.error("Error creating interviewer:", error)
    return NextResponse.json(
      { error: "Failed to create interviewer" },
      { status: 500 }
    )
  }
}
