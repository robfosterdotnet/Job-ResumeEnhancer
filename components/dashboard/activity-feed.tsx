"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ActivityItem } from "./activity-item"
import { Loader2, RefreshCw } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"

interface Activity {
  id: number
  activityType: string
  title: string
  description?: string | null
  createdAt: string
  jobApplication?: {
    id: number
    title: string
    company?: string | null
  } | null
}

interface ActivityFeedProps {
  initialActivities: Activity[]
  initialHasMore: boolean
}

export function ActivityFeed({ initialActivities, initialHasMore }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/dashboard/activity?offset=${activities.length}&limit=10`
      )
      const data = await response.json()

      if (data.activities) {
        setActivities((prev) => [...prev, ...data.activities])
        setHasMore(data.pagination?.hasMore ?? false)
      }
    } catch (error) {
      console.error("Failed to load more activities:", error)
    } finally {
      setLoading(false)
    }
  }, [activities.length, hasMore, loading])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dashboard/activity?limit=20`)
      const data = await response.json()

      if (data.activities) {
        setActivities(data.activities)
        setHasMore(data.pagination?.hasMore ?? false)
      }
    } catch (error) {
      console.error("Failed to refresh activities:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Group activities by date
  const groupedActivities: { label: string; items: Activity[] }[] = []
  let currentGroup: { label: string; items: Activity[] } | null = null

  activities.forEach((activity) => {
    const date = new Date(activity.createdAt)
    let label: string

    if (isToday(date)) {
      label = "Today"
    } else if (isYesterday(date)) {
      label = "Yesterday"
    } else {
      label = format(date, "MMMM d, yyyy")
    }

    if (!currentGroup || currentGroup.label !== label) {
      currentGroup = { label, items: [] }
      groupedActivities.push(currentGroup)
    }
    currentGroup.items.push(activity)
  })

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Activity</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              Your activity feed will appear here as you use the app
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedActivities.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      id={activity.id}
                      activityType={activity.activityType as Parameters<typeof ActivityItem>[0]["activityType"]}
                      title={activity.title}
                      description={activity.description}
                      createdAt={new Date(activity.createdAt)}
                      jobApplication={activity.jobApplication}
                    />
                  ))}
                </div>
              </div>
            ))}

            {hasMore && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
