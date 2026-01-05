"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: number
  trendLabel?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  className,
}: MetricCardProps) {
  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return "text-muted-foreground"
    return trend > 0 ? "text-green-600" : "text-red-600"
  }

  const renderTrendIcon = () => {
    if (trend === undefined || trend === 0) {
      return <Minus className="h-3 w-3 mr-1" />
    }
    return trend > 0 ? (
      <TrendingUp className="h-3 w-3 mr-1" />
    ) : (
      <TrendingDown className="h-3 w-3 mr-1" />
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <div className={cn("flex items-center text-xs mt-1", getTrendColor())}>
            {renderTrendIcon()}
            <span>
              {trend > 0 ? "+" : ""}
              {trend}
              {trendLabel && ` ${trendLabel}`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
