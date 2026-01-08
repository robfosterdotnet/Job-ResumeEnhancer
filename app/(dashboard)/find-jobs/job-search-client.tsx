"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { JobSearchForm } from "@/components/job-search/job-search-form"
import { JobSearchResults } from "@/components/job-search/job-search-results"
import { ResumeSelectPrompt } from "@/components/job-search/resume-select-prompt"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"
import type { JobSearchResult, QuickFitData } from "@/components/job-search"

interface JobSearchClientProps {
  masterResumeId: number | null
}

export function JobSearchClient({ masterResumeId }: JobSearchClientProps) {
  const router = useRouter()
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<JobSearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [quickFits, setQuickFits] = useState<Record<string, QuickFitData | null>>({})
  const [calculatingIds, setCalculatingIds] = useState<Set<string>>(new Set())
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())

  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true)
    setSearchQuery(query)
    setHasSearched(true)
    setQuickFits({})

    try {
      const response = await fetch(
        `/api/job-search?q=${encodeURIComponent(query)}&limit=10`
      )
      if (!response.ok) {
        throw new Error("Search failed")
      }
      const data = await response.json()
      setResults(data.results)
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleCalculateFit = useCallback(
    async (job: JobSearchResult) => {
      if (!masterResumeId) return

      setCalculatingIds((prev) => new Set(prev).add(job.id))

      try {
        const response = await fetch("/api/job-search/quick-fit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeId: masterResumeId,
            jobTitle: job.title,
            jobSnippet: job.snippet,
          }),
        })

        if (!response.ok) {
          throw new Error("Quick fit calculation failed")
        }

        const data: QuickFitData = await response.json()
        setQuickFits((prev) => ({ ...prev, [job.id]: data }))
      } catch (error) {
        console.error("Quick fit error:", error)
        setQuickFits((prev) => ({ ...prev, [job.id]: null }))
      } finally {
        setCalculatingIds((prev) => {
          const next = new Set(prev)
          next.delete(job.id)
          return next
        })
      }
    },
    [masterResumeId]
  )

  const handleAddJob = useCallback(
    async (job: JobSearchResult) => {
      setAddingIds((prev) => new Set(prev).add(job.id))

      try {
        const response = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: job.title,
            companyName: job.company || undefined,
            jobDescriptionText: job.snippet,
            jobDescriptionUrl: job.url,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to add job")
        }

        const data = await response.json()
        router.push(`/jobs/${data.job.id}`)
      } catch (error) {
        console.error("Add job error:", error)
      } finally {
        setAddingIds((prev) => {
          const next = new Set(prev)
          next.delete(job.id)
          return next
        })
      }
    },
    [router]
  )

  return (
    <div className="space-y-6">
      {/* Resume warning */}
      {!masterResumeId && <ResumeSelectPrompt />}

      {/* Search Form */}
      <JobSearchForm onSearch={handleSearch} isSearching={isSearching} />

      {/* Results */}
      {hasSearched ? (
        isSearching ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="animate-pulse flex flex-col items-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Searching for jobs...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <JobSearchResults
            results={results}
            query={searchQuery}
            resumeId={masterResumeId}
            quickFits={quickFits}
            calculatingIds={calculatingIds}
            addingIds={addingIds}
            onCalculateFit={handleCalculateFit}
            onAddJob={handleAddJob}
          />
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Search for Jobs</h3>
            <p className="text-muted-foreground max-w-md">
              Enter job titles, skills, or locations to find opportunities. We&apos;ll search
              across major job boards and show you relevant listings.
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Example searches:</p>
              <ul className="mt-2 space-y-1">
                <li>&ldquo;Software Engineer Remote&rdquo;</li>
                <li>&ldquo;Data Analyst Nashville TN&rdquo;</li>
                <li>&ldquo;Product Manager San Francisco&rdquo;</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
