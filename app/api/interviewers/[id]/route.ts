import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { interviewerProfiles, jobApplications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"
import { parseLinkedInText } from "@/lib/parsers/linkedin-parser"
import { analyzeInterviewer } from "@/lib/ai/agents/interviewer-analyzer"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Increase timeout for re-analysis
export const maxDuration = 300

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/interviewers/[id] - Get single interviewer
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    const interviewerId = parseInt(id, 10)

    const interviewer = await db.query.interviewerProfiles.findFirst({
      where: eq(interviewerProfiles.id, interviewerId),
    })

    if (!interviewer) {
      return NextResponse.json(
        { error: "Interviewer not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ interviewer })
  } catch (error) {
    console.error("Error fetching interviewer:", error)
    return NextResponse.json(
      { error: "Failed to fetch interviewer" },
      { status: 500 }
    )
  }
}

// PATCH /api/interviewers/[id] - Update interviewer (with optional re-analysis)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    const interviewerId = parseInt(id, 10)
    const body = await request.json()
    const { name, role, interviewRole, linkedInUrl, linkedInContent, reanalyze } =
      body

    // Get existing interviewer
    const existing = await db.query.interviewerProfiles.findFirst({
      where: eq(interviewerProfiles.id, interviewerId),
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Interviewer not found" },
        { status: 404 }
      )
    }

    // Parse new LinkedIn content if provided
    let parsedProfile = null
    if (linkedInContent && typeof linkedInContent === "string") {
      parsedProfile = parseLinkedInText(linkedInContent)
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (interviewRole !== undefined) updateData.interviewRole = interviewRole
    if (linkedInUrl !== undefined) updateData.linkedInUrl = linkedInUrl

    if (parsedProfile) {
      updateData.headline = parsedProfile.headline || null
      updateData.summary = parsedProfile.summary || null
      updateData.location = parsedProfile.location || null
      updateData.experienceJson = JSON.stringify(parsedProfile.experience)
      updateData.educationJson = JSON.stringify(parsedProfile.education)
      updateData.skillsJson = JSON.stringify(parsedProfile.skills)
      updateData.rawLinkedInContent = linkedInContent
    }

    // If not reanalyzing, just update and return
    if (!reanalyze || !parsedProfile) {
      const [updated] = await db
        .update(interviewerProfiles)
        .set(updateData)
        .where(eq(interviewerProfiles.id, interviewerId))
        .returning()

      return NextResponse.json({ interviewer: updated })
    }

    // Reanalyze with new LinkedIn content
    updateData.analysisStatus = "analyzing"
    await db
      .update(interviewerProfiles)
      .set(updateData)
      .where(eq(interviewerProfiles.id, interviewerId))

    // Get job for context
    const job = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.id, existing.jobApplicationId),
      with: {
        resume: true,
      },
    })

    // Stream the analysis
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const analysis = await analyzeInterviewer({
            interviewerProfile: parsedProfile!,
            interviewerName: name || existing.name,
            interviewerRole: role || existing.role || parsedProfile!.headline,
            interviewRole: interviewRole || existing.interviewRole || undefined,
            candidateResume: job?.resume?.parsedContent || undefined,
            jobDescription: job?.jobDescriptionText,
            onProgress: (progress) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "progress", ...progress })}\n\n`
                )
              )
            },
          })

          // Update with analysis results
          const [updated] = await db
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
            .where(eq(interviewerProfiles.id, interviewerId))
            .returning()

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                interviewer: updated,
                analysis,
              })}\n\n`
            )
          )
          controller.close()
        } catch (error) {
          await db
            .update(interviewerProfiles)
            .set({
              analysisStatus: "failed",
              updatedAt: new Date(),
            })
            .where(eq(interviewerProfiles.id, interviewerId))

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
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
    console.error("Error updating interviewer:", error)
    return NextResponse.json(
      { error: "Failed to update interviewer" },
      { status: 500 }
    )
  }
}

// DELETE /api/interviewers/[id] - Delete interviewer
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    const interviewerId = parseInt(id, 10)

    const existing = await db.query.interviewerProfiles.findFirst({
      where: eq(interviewerProfiles.id, interviewerId),
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Interviewer not found" },
        { status: 404 }
      )
    }

    await db
      .delete(interviewerProfiles)
      .where(eq(interviewerProfiles.id, interviewerId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting interviewer:", error)
    return NextResponse.json(
      { error: "Failed to delete interviewer" },
      { status: 500 }
    )
  }
}
