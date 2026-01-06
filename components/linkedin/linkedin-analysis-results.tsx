"use client"

import { LinkedInOverallScore, LinkedInScoreCard } from "./linkedin-score-card"
import { LinkedInHeadlineSuggestions } from "./linkedin-headline-suggestions"
import { LinkedInSummaryRewrite } from "./linkedin-summary-rewrite"
import { LinkedInSkillsAnalysis } from "./linkedin-skills-analysis"
import { LinkedInCompletenessChecklist } from "./linkedin-completeness-checklist"
import { LinkedInKeywords } from "./linkedin-keywords"
import {
  Type,
  FileText,
  Briefcase,
  Wrench,
  ClipboardCheck,
  Search,
} from "lucide-react"
import type { LinkedInAnalysis } from "@/lib/ai/agents/linkedin-optimizer"

interface LinkedInAnalysisResultsProps {
  analysis: LinkedInAnalysis
  sectionScores: {
    headline: number
    summary: number
    experience: number
    skills: number
    completeness: number
    keywords: number
  }
  currentHeadline?: string
  currentSummary?: string
  currentSkills?: string[]
  targetRole?: string
}

export function LinkedInAnalysisResults({
  analysis,
  sectionScores,
  currentHeadline,
  currentSummary,
  currentSkills,
  targetRole,
}: LinkedInAnalysisResultsProps) {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <LinkedInOverallScore
        score={analysis.overallScore}
        summary={analysis.overallSummary}
      />

      {/* Section Scores Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LinkedInScoreCard
          title="Headline"
          score={sectionScores.headline}
          icon={Type}
          description="How optimized is your headline"
        />
        <LinkedInScoreCard
          title="About Section"
          score={sectionScores.summary}
          icon={FileText}
          description="Summary effectiveness"
        />
        <LinkedInScoreCard
          title="Experience"
          score={sectionScores.experience}
          icon={Briefcase}
          description="Work history optimization"
        />
        <LinkedInScoreCard
          title="Skills"
          score={sectionScores.skills}
          icon={Wrench}
          description="Skills alignment"
        />
        <LinkedInScoreCard
          title="Completeness"
          score={sectionScores.completeness}
          icon={ClipboardCheck}
          description="Profile sections filled"
        />
        <LinkedInScoreCard
          title="Keywords"
          score={sectionScores.keywords}
          icon={Search}
          description="Search visibility"
        />
      </div>

      {/* Headline Suggestions */}
      <LinkedInHeadlineSuggestions
        currentHeadline={currentHeadline}
        analysis={analysis.headlineAnalysis}
        suggestedHeadlines={analysis.suggestedHeadlines}
      />

      {/* Summary Rewrite */}
      <LinkedInSummaryRewrite
        currentSummary={currentSummary}
        analysis={analysis.summaryAnalysis}
        suggestedSummary={analysis.suggestedSummary}
      />

      {/* Skills Analysis */}
      <LinkedInSkillsAnalysis
        analysis={analysis.skillsAnalysis}
        currentSkills={currentSkills}
      />

      {/* Keywords to Add */}
      <LinkedInKeywords
        keywords={analysis.keywordsToAdd}
        targetRole={targetRole}
      />

      {/* Completeness Checklist */}
      <LinkedInCompletenessChecklist
        checklist={analysis.completenessChecklist}
        completenessScore={sectionScores.completeness}
      />
    </div>
  )
}
