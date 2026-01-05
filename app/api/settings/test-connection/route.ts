import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { userSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"
import { parseRequestBody } from "@/lib/utils/api-validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const testConnectionSchema = z.object({
  service: z.enum(["brave", "azure-openai"]),
})

// POST /api/settings/test-connection - Test API connections
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const parsed = await parseRequestBody(request, testConnectionSchema)
    if (!parsed.success) return parsed.response

    const { service } = parsed.data

    if (service === "azure-openai") {
      // Test Azure OpenAI connection
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT
      const apiKey = process.env.AZURE_OPENAI_API_KEY
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT
      const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-07-01-preview"

      if (!endpoint || !apiKey || !deployment) {
        return NextResponse.json({
          success: false,
          message: "Azure OpenAI not configured. Check environment variables.",
        })
      }

      try {
        const startTime = Date.now()
        const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Say 'connected' in one word." }],
            max_completion_tokens: 10,
          }),
        })

        const latency = Date.now() - startTime

        if (response.ok) {
          return NextResponse.json({
            success: true,
            message: `Connected to Azure OpenAI (${deployment})`,
            latency,
          })
        } else {
          const error = await response.json().catch(() => ({}))
          return NextResponse.json({
            success: false,
            message: error.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          })
        }
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: error instanceof Error ? error.message : "Connection failed",
        })
      }
    }

    if (service === "brave") {
      // Get Brave API key from settings or env
      const settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.id, 1),
      })

      const apiKey = settings?.braveSearchApiKey || process.env.BRAVE_SEARCH_API_KEY

      if (!apiKey) {
        return NextResponse.json({
          success: false,
          message: "Brave Search API key not configured",
        })
      }

      try {
        const startTime = Date.now()
        const response = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=test&count=1`,
          {
            headers: {
              "Accept": "application/json",
              "X-Subscription-Token": apiKey,
            },
          }
        )

        const latency = Date.now() - startTime

        if (response.ok) {
          return NextResponse.json({
            success: true,
            message: "Connected to Brave Search API",
            latency,
          })
        } else {
          const error = await response.json().catch(() => ({}))
          return NextResponse.json({
            success: false,
            message: error.message || `HTTP ${response.status}: ${response.statusText}`,
          })
        }
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: error instanceof Error ? error.message : "Connection failed",
        })
      }
    }

    return NextResponse.json({
      success: false,
      message: "Unknown service",
    })
  } catch (error) {
    console.error("Error testing connection:", error)
    return NextResponse.json(
      { error: "Failed to test connection" },
      { status: 500 }
    )
  }
}
