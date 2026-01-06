"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/dashboard/header"
import { LinkedInProfileInput } from "@/components/linkedin/linkedin-profile-input"
import { LinkedInAnalysisResults } from "@/components/linkedin/linkedin-analysis-results"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Linkedin,
  ArrowLeft,
  Briefcase,
  AlertCircle,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { consumeSSEStream } from "@/lib/utils/sse"
import type { LinkedInAnalysis } from "@/lib/ai/agents/linkedin-optimizer"
import { parseLinkedInText } from "@/lib/parsers/linkedin-parser"

interface JobData {
  id: number
  title: string
  company: { name: string } | null
  jobDescriptionText: string
}

interface AnalysisHistory {
  id: number
  createdAt: string
  overallScore: number | null
  targetRole: string | null
}

export default function JobLinkedInPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = use(params)
  const router = useRouter()

  const [job, setJob] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(true)
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
  const [parsedProfile, setParsedProfile] = useState<ReturnType<typeof parseLinkedInText> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previousAnalyses, setPreviousAnalyses] = useState<AnalysisHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Load job data
  useEffect(() => {
    const loadJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ""}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setJob(data.job)
        } else if (response.status === 404) {
          router.push("/jobs")
        }
      } catch (err) {
        console.error("Failed to load job:", err)
      } finally {
        setLoading(false)
      }
    }

    const loadAnalyses = async () => {
      try {
        const response = await fetch(
          `/api/agents/linkedin-optimizer?jobApplicationId=${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ""}`,
            },
          }
        )
        if (response.ok) {
          const data = await response.json()
          setPreviousAnalyses(data.analyses || [])
        }
      } catch (err) {
        console.error("Failed to load analyses:", err)
      }
    }

    loadJob()
    loadAnalyses()
  }, [jobId, router])

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
          targetRole: data.targetRole || job?.title,
          targetIndustry: data.targetIndustry || undefined,
          jobApplicationId: parseInt(jobId, 10),
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
            setIsAnalyzing(false)
            // Refresh analyses list
            fetch(`/api/agents/linkedin-optimizer?jobApplicationId=${jobId}`, {
              headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ""}`,
              },
            })
              .then((res) => res.json())
              .then((data) => setPreviousAnalyses(data.analyses || []))
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

  const loadPreviousAnalysis = async (analysisId: number) => {
    try {
      const response = await fetch(
        `/api/agents/linkedin-optimizer?jobApplicationId=${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ""}`,
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        const fullAnalysis = data.analyses.find(
          (a: { id: number }) => a.id === analysisId
        )
        if (fullAnalysis) {
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
        }
      }
    } catch (err) {
      console.error("Failed to load analysis:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <Header title="LinkedIn Optimizer" />
        <div className="p-6">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex flex-col">
        <Header title="LinkedIn Optimizer" />
        <div className="p-6">
          <Card className="border-destructive">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-destructive">Job application not found</p>
              <Button asChild className="mt-4">
                <Link href="/jobs">Back to Jobs</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="LinkedIn Optimizer" />

      <div className="p-6 space-y-6">
        {/* Back Link */}
        <Link
          href={`/jobs/${jobId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to {job.title}
        </Link>

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Linkedin className="h-6 w-6 text-[#0A66C2]" />
              Optimize for This Role
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              {job.title} at {job.company?.name || "Unknown Company"}
            </p>
          </div>
        </div>

        {/* Job Context Card */}
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Job-Aligned Optimization
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Your LinkedIn profile will be optimized specifically for this
                  role, with keyword suggestions and content tailored to match
                  the job description.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previous Analyses */}
        {previousAnalyses.length > 0 && (
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setShowHistory(!showHistory)}
            >
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Previous Analyses for This Job ({previousAnalyses.length})
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
                <div className="space-y-2">
                  {previousAnalyses.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => loadPreviousAnalysis(a.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          Score: {a.overallScore || 0}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Input Form */}
        <LinkedInProfileInput
          onSubmit={handleAnalyze}
          isLoading={isAnalyzing}
          initialTargetRole={job.title}
        />

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
            targetRole={job.title}
          />
        )}
      </div>
    </div>
  )
}
