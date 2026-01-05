import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  jobApplications,
  companies,
  resumes,
  resumeAnalyses,
  interviewQuestions,
  companyResearch,
  leadershipTeam,
  financialInfo,
  companyNews,
  legalIssues,
  chatSessions,
  chatMessages,
  mockInterviewSessions,
  mockInterviewResponses,
  coverLetters,
} from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth/middleware"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/settings/export - Export all data as JSON
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    // Fetch all data
    const [
      jobs,
      companiesList,
      resumesList,
      analyses,
      questions,
      research,
      leadership,
      financials,
      news,
      legal,
      sessions,
      messages,
      interviews,
      responses,
      letters,
      settings,
    ] = await Promise.all([
      db.select().from(jobApplications),
      db.select().from(companies),
      db.select({
        id: resumes.id,
        filename: resumes.filename,
        parsedContent: resumes.parsedContent,
        fileType: resumes.fileType,
        createdAt: resumes.createdAt,
      }).from(resumes),
      db.select().from(resumeAnalyses),
      db.select().from(interviewQuestions),
      db.select().from(companyResearch),
      db.select().from(leadershipTeam),
      db.select().from(financialInfo),
      db.select().from(companyNews),
      db.select().from(legalIssues),
      db.select().from(chatSessions),
      db.select().from(chatMessages),
      db.select().from(mockInterviewSessions),
      db.select().from(mockInterviewResponses),
      db.select().from(coverLetters),
      db.query.userSettings.findFirst(),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      data: {
        settings: settings ? {
          fullName: settings.fullName,
          email: settings.email,
          phone: settings.phone,
          linkedinUrl: settings.linkedinUrl,
          portfolioUrl: settings.portfolioUrl,
          analysisDepth: settings.analysisDepth,
          analysisFocusAreasJson: settings.analysisFocusAreasJson,
          interviewQuestionCount: settings.interviewQuestionCount,
          coverLetterTone: settings.coverLetterTone,
          coverLetterLength: settings.coverLetterLength,
          coverLetterUseAnalysis: settings.coverLetterUseAnalysis,
          researchDepth: settings.researchDepth,
          researchSectionsJson: settings.researchSectionsJson,
          mockInterviewQuestionCount: settings.mockInterviewQuestionCount,
          mockInterviewDifficulty: settings.mockInterviewDifficulty,
          mockInterviewFeedbackMode: settings.mockInterviewFeedbackMode,
          mockInterviewVoiceEnabled: settings.mockInterviewVoiceEnabled,
          chatResponseStyle: settings.chatResponseStyle,
          chatIncludeSources: settings.chatIncludeSources,
          theme: settings.theme,
          accentColor: settings.accentColor,
          uiDensity: settings.uiDensity,
          enableAnimations: settings.enableAnimations,
          fontSize: settings.fontSize,
          // Explicitly exclude API keys
        } : null,
        companies: companiesList,
        resumes: resumesList,
        jobApplications: jobs,
        resumeAnalyses: analyses,
        interviewQuestions: questions,
        companyResearch: research,
        leadershipTeam: leadership,
        financialInfo: financials,
        companyNews: news,
        legalIssues: legal,
        chatSessions: sessions,
        chatMessages: messages,
        mockInterviewSessions: interviews,
        mockInterviewResponses: responses,
        coverLetters: letters,
      },
      stats: {
        jobCount: jobs.length,
        companyCount: companiesList.length,
        resumeCount: resumesList.length,
        analysisCount: analyses.length,
        chatSessionCount: sessions.length,
        interviewCount: interviews.length,
        coverLetterCount: letters.length,
      },
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}
