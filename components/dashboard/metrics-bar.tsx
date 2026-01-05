"use client"

import { MetricCard } from "./metric-card"
import {
  Briefcase,
  Target,
  CalendarCheck,
  MessageSquare,
  FileText,
  Mic,
} from "lucide-react"

interface DashboardStats {
  total: number
  avgFitScore: number
  thisWeek: number
  weeklyDelta: number
  interviewsScheduled: number
  coverLettersGenerated: number
  mockInterviewsCompleted: number
  responseRate: number
}

interface MetricsBarProps {
  stats: DashboardStats
}

export function MetricsBar({ stats }: MetricsBarProps) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      <MetricCard
        title="Total Applications"
        value={stats.total}
        icon={Briefcase}
        trend={stats.weeklyDelta}
        trendLabel="this week"
      />
      <MetricCard
        title="Avg Fit Score"
        value={`${stats.avgFitScore}%`}
        icon={Target}
      />
      <MetricCard
        title="Response Rate"
        value={`${stats.responseRate}%`}
        icon={MessageSquare}
      />
      <MetricCard
        title="Interviewing"
        value={stats.interviewsScheduled}
        icon={CalendarCheck}
      />
      <MetricCard
        title="Cover Letters"
        value={stats.coverLettersGenerated}
        icon={FileText}
      />
      <MetricCard
        title="Mock Interviews"
        value={stats.mockInterviewsCompleted}
        icon={Mic}
      />
    </div>
  )
}
