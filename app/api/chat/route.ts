import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import {
  chatSessions,
  chatMessages,
  jobApplications,
  resumeAnalyses,
  companyResearch,
} from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { streamChatCompletion, type ChatMessage } from "@/lib/ai/client"
import { parseRequestBody } from "@/lib/utils/api-validation"
import { requireAuth } from "@/lib/auth/middleware"

// SQLite requires Node.js runtime
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const chatPostSchema = z.object({
  sessionId: z.coerce.number().int().positive().optional(),
  jobApplicationId: z.coerce.number().int().positive().optional(),
  message: z.string().min(1, "Message is required"),
})

// POST /api/chat - Send a message and get AI response
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const parsed = await parseRequestBody(request, chatPostSchema)
    if (!parsed.success) return parsed.response

    const { sessionId, jobApplicationId, message } = parsed.data

    let session: typeof chatSessions.$inferSelect | undefined

    // Create or get session
    if (sessionId) {
      session = await db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, sessionId),
      })
    }

    if (!session && jobApplicationId) {
      // Create new session
      const [newSession] = await db
        .insert(chatSessions)
        .values({
          jobApplicationId,
          title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        })
        .returning()
      session = newSession
    }

    if (!session) {
      return NextResponse.json(
        { error: "Session ID or job application ID is required" },
        { status: 400 }
      )
    }

    // Save user message
    await db.insert(chatMessages).values({
      sessionId: session.id,
      role: "user",
      content: message,
    })

    // Gather context from job application
    let context = ""
    if (session.jobApplicationId) {
      const job = await db.query.jobApplications.findFirst({
        where: eq(jobApplications.id, session.jobApplicationId),
        with: {
          company: true,
          resume: true,
        },
      })

      if (job) {
        context += `\n## Job Application Context:\n`
        context += `Title: ${job.title}\n`
        if (job.company) context += `Company: ${job.company.name}\n`
        context += `\nJob Description:\n${job.jobDescriptionText}\n`

        if (job.resume) {
          context += `\n## Resume:\n${job.resume.parsedContent}\n`
        }

        // Get latest analysis
        const analysis = await db.query.resumeAnalyses.findFirst({
          where: eq(resumeAnalyses.jobApplicationId, job.id),
          orderBy: [desc(resumeAnalyses.createdAt)],
        })

        if (analysis) {
          context += `\n## Resume Analysis:\n`
          context += `Fit Score: ${analysis.fitScore}%\n`
          context += `Summary: ${analysis.overallSummary}\n`
          if (analysis.strengthsJson) {
            context += `Strengths: ${analysis.strengthsJson}\n`
          }
          if (analysis.weaknessesJson) {
            context += `Weaknesses: ${analysis.weaknessesJson}\n`
          }
        }

        // Get company research
        if (job.companyId) {
          const research = await db.query.companyResearch.findFirst({
            where: eq(companyResearch.companyId, job.companyId),
            orderBy: [desc(companyResearch.createdAt)],
            with: {
              leadershipTeam: true,
              news: true,
              legalIssues: true,
            },
          })

          if (research) {
            context += `\n## Company Research:\n`
            if (research.coreBusinessJson) {
              context += `Overview: ${research.coreBusinessJson}\n`
            }
            if (research.cultureValuesJson) {
              context += `Culture: ${research.cultureValuesJson}\n`
            }
            if (research.ethicsAlignmentJson) {
              context += `Ethics Alignment: ${research.ethicsAlignmentJson}\n`
            }
          }
        }
      }
    }

    // Get chat history
    const history = await db.query.chatMessages.findMany({
      where: eq(chatMessages.sessionId, session.id),
      orderBy: [chatMessages.createdAt],
      limit: 20,
    })

    // Build messages for AI
    const systemPrompt = `You are a helpful career assistant helping a job seeker. You have access to their job application information, resume analysis, and company research. Answer questions based on this context and provide actionable advice.

${context}`

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ]

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = ""

          await streamChatCompletion(messages, {
            maxTokens: 2000,
            onChunk: (chunk) => {
              fullResponse += chunk
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`)
              )
            },
          })

          // Save assistant message
          const [savedMessage] = await db
            .insert(chatMessages)
            .values({
              sessionId: session!.id,
              role: "assistant",
              content: fullResponse,
            })
            .returning()

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                messageId: savedMessage.id,
                sessionId: session!.id,
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
    console.error("Error in chat:", error)
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 })
  }
}

// GET /api/chat?sessionId=X - Get chat history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get("sessionId")
    const jobApplicationId = searchParams.get("jobApplicationId")

    if (sessionId) {
      const session = await db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, parseInt(sessionId, 10)),
        with: {
          messages: {
            orderBy: [chatMessages.createdAt],
          },
        },
      })

      return NextResponse.json({ session })
    }

    if (jobApplicationId) {
      const sessions = await db.query.chatSessions.findMany({
        where: eq(chatSessions.jobApplicationId, parseInt(jobApplicationId, 10)),
        with: {
          messages: {
            orderBy: [chatMessages.createdAt],
          },
        },
        orderBy: [desc(chatSessions.updatedAt)],
      })

      return NextResponse.json({ sessions })
    }

    return NextResponse.json(
      { error: "Session ID or job application ID is required" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error fetching chat:", error)
    return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 })
  }
}
