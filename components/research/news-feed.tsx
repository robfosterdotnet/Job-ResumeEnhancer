"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Newspaper, ExternalLink, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface NewsItem {
  id: number
  title: string
  summary?: string | null
  sourceUrl?: string | null
  sourceName?: string | null
  publishedAt?: Date | null
  sentiment?: "positive" | "negative" | "neutral" | null
}

interface NewsFeedProps {
  news: NewsItem[]
}

const sentimentConfig = {
  positive: {
    icon: TrendingUp,
    color: "text-success",
    bgColor: "bg-success/10",
    label: "Positive",
  },
  negative: {
    icon: TrendingDown,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    label: "Negative",
  },
  neutral: {
    icon: Minus,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    label: "Neutral",
  },
}

export function NewsFeed({ news }: NewsFeedProps) {
  // Calculate sentiment summary
  const sentimentCounts = news.reduce(
    (acc, item) => {
      if (item.sentiment) {
        acc[item.sentiment]++
      }
      return acc
    },
    { positive: 0, negative: 0, neutral: 0 }
  )

  const totalWithSentiment =
    sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral
  const overallSentiment =
    totalWithSentiment > 0
      ? sentimentCounts.positive > sentimentCounts.negative
        ? "positive"
        : sentimentCounts.negative > sentimentCounts.positive
        ? "negative"
        : "neutral"
      : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              Recent News ({news.length})
            </CardTitle>
            <CardDescription>Latest news and press coverage</CardDescription>
          </div>
          {overallSentiment && (
            <Badge
              variant="secondary"
              className={cn("gap-1", sentimentConfig[overallSentiment].bgColor)}
            >
              {(() => {
                const Icon = sentimentConfig[overallSentiment].icon
                return <Icon className="h-3 w-3" />
              })()}
              Overall: {sentimentConfig[overallSentiment].label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {news.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No recent news articles available.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Sentiment Summary */}
            {totalWithSentiment > 0 && (
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sentiment:</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-sm">{sentimentCounts.positive}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Minus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{sentimentCounts.neutral}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="text-sm">{sentimentCounts.negative}</span>
                  </div>
                </div>
              </div>
            )}

            {/* News List */}
            <div className="space-y-3">
              {news.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.sentiment && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              sentimentConfig[item.sentiment].bgColor,
                              sentimentConfig[item.sentiment].color
                            )}
                          >
                            {sentimentConfig[item.sentiment].label}
                          </Badge>
                        )}
                        {item.sourceName && (
                          <span className="text-xs text-muted-foreground">
                            {item.sourceName}
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium line-clamp-2">{item.title}</h4>
                      {item.summary && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.summary}
                        </p>
                      )}
                      {item.publishedAt && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(item.publishedAt), {
                            addSuffix: true,
                          })}
                        </div>
                      )}
                    </div>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary flex-shrink-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
