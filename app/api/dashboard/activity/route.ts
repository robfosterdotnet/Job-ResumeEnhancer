import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { activityLogs } from "@/lib/db/schema"
import { desc, eq, count } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/dashboard/activity - Get recent activity feed
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100)
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0)
    const activityType = searchParams.get("type")

    // Build query
    const activities = await db.query.activityLogs.findMany({
      where: activityType && activityType !== "all"
        ? eq(activityLogs.activityType, activityType as typeof activityLogs.$inferSelect.activityType)
        : undefined,
      with: {
        jobApplication: {
          with: {
            company: true,
          },
        },
      },
      orderBy: [desc(activityLogs.createdAt)],
      limit: limit + 1, // Fetch one extra to check if there's more
      offset,
    })

    // Check if there are more results
    const hasMore = activities.length > limit
    const results = hasMore ? activities.slice(0, limit) : activities

    // Format the response
    const formattedActivities = results.map((activity) => ({
      id: activity.id,
      activityType: activity.activityType,
      title: activity.title,
      description: activity.description,
      createdAt: activity.createdAt,
      jobApplication: activity.jobApplication
        ? {
            id: activity.jobApplication.id,
            title: activity.jobApplication.title,
            company: activity.jobApplication.company?.name,
          }
        : null,
    }))

    // Get total count for pagination info
    const [totalResult] = await db
      .select({ count: count() })
      .from(activityLogs)

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        offset,
        limit,
        total: totalResult.count,
        hasMore,
      },
    })
  } catch (error) {
    console.error("Error fetching activity feed:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity feed" },
      { status: 500 }
    )
  }
}
