"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { LinkedInProfileInput } from "@/components/linkedin/linkedin-profile-input"
import { LinkedInAnalysisResults } from "@/components/linkedin/linkedin-analysis-results"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Linkedin,
  History,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"
import { consumeSSEStream } from "@/lib/utils/sse"
import type { LinkedInAnalysis } from "@/lib/ai/agents/linkedin-optimizer"
import { parseLinkedInText } from "@/lib/parsers/linkedin-parser"

interface AnalysisHistory {
  id: number
  createdAt: string
  overallScore: number | null
  targetRole: string | null
  targetIndustry: string | null
}

interface ProfileData {
  id: number
  fullName: string | null
  headline: string | null
  summary: string | null
  skillsJson: string | null
  updatedAt: string
  analyses: AnalysisHistory[]
}

export default function LinkedInPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState({ stage: "", message: "", percentage: 0 })
  const [analysis, setAnalysis] = useState<LinkedInAnalysis | null>(null)
  const [sectionScores, setSectionScores] = useState<{
    headline: number
    summary: number
    experience: number
    skills: number
    completeness: number
    keywords: number
  } | null>(null)
  const [profileId, setProfileId] = useState<number | null>(null)
  const [parsedProfile, setParsedProfile] = useState<ReturnType<typeof parseLinkedInText> | null>(null)
  const [error, setError] = useState<string | null>(null)

  // History
  const [profiles, setProfiles] = useState<ProfileData[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Load saved profiles on mount
  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch("/api/linkedin-profiles", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ""}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles || [])
      }
    } catch (err) {
      console.error("Failed to load profiles:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAnalyze = async (data: {
    profileContent: string
    targetRole: string
    targetIndustry: string
  }) => {
    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)
    setSectionScores(null)

    // Parse the profile for display
    const parsed = parseLinkedInText(data.profileContent)
    setParsedProfile(parsed)

    try {
      const response = await fetch("/api/agents/linkedin-optimizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ""}`,
        },
        body: JSON.stringify({
          profileContent: data.profileContent,
          targetRole: data.targetRole || undefined,
          targetIndustry: data.targetIndustry || undefined,
          profileId: profileId || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to start analysis")
      }

      await consumeSSEStream(response, {
        onEvent: (event) => {
          if (event.type === "progress") {
            setProgress({
              stage: event.stage as string,
              message: event.message as string,
              percentage: event.percentage as number,
            })
          } else if (event.type === "complete") {
            setAnalysis(event.analysis as LinkedInAnalysis)
            setSectionScores(event.sectionScores as typeof sectionScores)
            setProfileId(event.profileId as number)
            setIsAnalyzing(false)
            loadProfiles() // Refresh history
          } else if (event.type === "error") {
            setError(event.error as string)
            setIsAnalyzing(false)
          }
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed")
      setIsAnalyzing(false)
    }
  }

  const handleDeleteProfile = async (id: number) => {
    try {
      const response = await fetch(`/api/linkedin-profiles/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ""}`,
        },
      })
      if (response.ok) {
        setProfiles(profiles.filter((p) => p.id !== id))
        if (profileId === id) {
          setProfileId(null)
          setAnalysis(null)
          setSectionScores(null)
        }
      }
    } catch (err) {
      console.error("Failed to delete profile:", err)
    }
  }

  const loadPreviousAnalysis = async (profile: ProfileData) => {
    if (profile.analyses.length === 0) return

    setProfileId(profile.id)

    // Load full analysis
    try {
      const response = await fetch(
        `/api/agents/linkedin-optimizer?profileId=${profile.id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ""}`,
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        if (data.analyses && data.analyses.length > 0) {
          const fullAnalysis = data.analyses[0]
          // Reconstruct the analysis object from stored JSON
          setAnalysis({
            overallScore: fullAnalysis.overallScore || 0,
            overallSummary: fullAnalysis.overallSummary || "",
            headlineAnalysis: JSON.parse(fullAnalysis.headlineAnalysisJson || "{}"),
            summaryAnalysis: JSON.parse(fullAnalysis.summaryAnalysisJson || "{}"),
            experienceAnalysis: JSON.parse(fullAnalysis.experienceAnalysisJson || "{}"),
            skillsAnalysis: JSON.parse(fullAnalysis.skillsAnalysisJson || "{}"),
            suggestedHeadlines: JSON.parse(fullAnalysis.suggestedHeadlinesJson || "[]"),
            suggestedSummary: fullAnalysis.suggestedSummary || "",
            keywordsToAdd: JSON.parse(fullAnalysis.keywordsToAddJson || "[]"),
            completenessChecklist: JSON.parse(fullAnalysis.completenessChecklistJson || "{}"),
          })
          setSectionScores({
            headline: fullAnalysis.headlineScore || 0,
            summary: fullAnalysis.summaryScore || 0,
            experience: fullAnalysis.experienceScore || 0,
            skills: fullAnalysis.skillsScore || 0,
            completeness: fullAnalysis.completenessScore || 0,
            keywords: fullAnalysis.keywordScore || 0,
          })
          // Set parsed profile data
          setParsedProfile({
            fullName: profile.fullName || undefined,
            headline: profile.headline || undefined,
            summary: profile.summary || undefined,
            skills: profile.skillsJson ? JSON.parse(profile.skillsJson) : [],
            experience: [],
            education: [],
            certifications: [],
            rawContent: "",
          })
        }
      }
    } catch (err) {
      console.error("Failed to load analysis:", err)
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="LinkedIn Optimizer" />

      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Linkedin className="h-6 w-6 text-[#0A66C2]" />
              LinkedIn Profile Optimizer
            </h1>
            <p className="text-muted-foreground">
              Analyze and optimize your LinkedIn profile for better visibility
              and recruiter searches
            </p>
          </div>
        </div>

        {/* History Section */}
        {profiles.length > 0 && (
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setShowHistory(!showHistory)}
            >
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Previous Analyses ({profiles.length})
                </div>
                {showHistory ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
            {showHistory && (
              <CardContent>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => loadPreviousAnalysis(profile)}
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            {profile.fullName || "Unnamed Profile"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {profile.headline || "No headline"}
                          </p>
                          <div className="flex items-center gap-2">
                            {profile.analyses[0] && (
                              <Badge variant="outline">
                                Score: {profile.analyses[0].overallScore || 0}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(profile.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteProfile(profile.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )}

        {/* Input Form */}
        <LinkedInProfileInput onSubmit={handleAnalyze} isLoading={isAnalyzing} />

        {/* Progress Indicator */}
        {isAnalyzing && (
          <Card>
            <CardContent className="py-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{progress.message}</span>
                  <span className="text-sm text-muted-foreground">
                    {progress.percentage}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="py-4">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && sectionScores && (
          <LinkedInAnalysisResults
            analysis={analysis}
            sectionScores={sectionScores}
            currentHeadline={parsedProfile?.headline}
            currentSummary={parsedProfile?.summary}
            currentSkills={parsedProfile?.skills}
          />
        )}
      </div>
    </div>
  )
}
