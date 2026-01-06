"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Link as LinkIcon, FileText, AlertCircle, ClipboardCopy } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface GarbageContentErrorData {
  isGarbageError: boolean
  message: string
}

export function JobForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [error, setError] = useState("")
  const [showPasteHint, setShowPasteHint] = useState(false)
  const [garbageError, setGarbageError] = useState<GarbageContentErrorData | null>(null)

  const [title, setTitle] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState("")
  const [jobDescriptionText, setJobDescriptionText] = useState("")
  const [notes, setNotes] = useState("")
  const [activeTab, setActiveTab] = useState("url")

  const [scrapingStatus, setScrapingStatus] = useState("")

  const handleScrape = async () => {
    if (!jobDescriptionUrl) return

    setScraping(true)
    setError("")
    setGarbageError(null)
    setScrapingStatus("Fetching page...")

    try {
      setScrapingStatus("Fetching and formatting with AI...")
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobDescriptionUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if this is a garbage content detection error
        if (data.garbageDetected && data.suggestManualPaste) {
          // Set the garbage error state and auto-switch to paste tab
          setGarbageError({
            isGarbageError: true,
            message: data.error || "This job posting couldn't be automatically extracted.",
          })
          // Auto-switch to paste tab for better UX
          setActiveTab("text")
          // Don't populate any fields with garbage data
          return
        }
        throw new Error(data.error || "Failed to scrape URL")
      }

      setJobDescriptionText(data.description)
      if (data.title && !title) setTitle(data.title)
      if (data.company && !companyName) setCompanyName(data.company)

      if (data.cleanupFailed) {
        setError("AI formatting failed - showing raw content. You may want to clean it up manually.")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to scrape URL"
      setError(`Unable to fetch job description: ${errorMessage}`)
      setShowPasteHint(true)
    } finally {
      setScraping(false)
      setScrapingStatus("")
    }
  }

  const switchToPasteTab = () => {
    setActiveTab("text")
    setError("")
    setShowPasteHint(false)
    setGarbageError(null)
  }

  const dismissGarbageError = () => {
    setGarbageError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !jobDescriptionText) {
      setError("Title and job description are required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          companyName,
          jobDescriptionText,
          jobDescriptionUrl: jobDescriptionUrl || undefined,
          notes: notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create job application")
      }

      router.push(`/jobs/${data.job.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job application")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p>{error}</p>
              {showPasteHint && (
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-destructive underline mt-1"
                  onClick={switchToPasteTab}
                >
                  Click here to paste the job description manually instead
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {garbageError && (
        <div className="p-4 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 text-sm">
          <div className="flex items-start gap-3">
            <ClipboardCopy className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-medium mb-1">Manual copy/paste required</p>
                <p className="text-amber-800 dark:text-amber-200">
                  This job site uses dynamic content that couldn&apos;t be automatically extracted.
                  This is common with sites like Workday, BrassRing, Taleo, and iCIMS.
                </p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded p-3">
                <p className="font-medium text-amber-900 dark:text-amber-100 mb-2">To add this job:</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-800 dark:text-amber-200">
                  <li>Open the job posting in your browser</li>
                  <li>Select and copy all the job description text</li>
                  <li>Paste it in the text area below</li>
                </ol>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={dismissGarbageError}
                className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Basic information about the position</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Anthropic"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job Description *</CardTitle>
          <CardDescription>Enter the job description URL or paste the text directly</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                From URL
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Paste Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Input
                  value={jobDescriptionUrl}
                  onChange={(e) => setJobDescriptionUrl(e.target.value)}
                  placeholder="https://example.com/job/123"
                  type="url"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleScrape}
                  disabled={!jobDescriptionUrl || scraping}
                >
                  {scraping ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {scrapingStatus || "Fetching..."}
                    </>
                  ) : (
                    "Fetch"
                  )}
                </Button>
              </div>
              {jobDescriptionText && (
                <div className="space-y-4">
                  <div className="rounded-md border bg-muted/30 p-4 prose prose-sm dark:prose-invert max-w-none max-h-96 overflow-y-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {jobDescriptionText}
                    </ReactMarkdown>
                  </div>
                  <details className="text-sm text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">Edit raw text</summary>
                    <Textarea
                      value={jobDescriptionText}
                      onChange={(e) => setJobDescriptionText(e.target.value)}
                      placeholder="Job description will appear here after fetching..."
                      rows={12}
                      className="mt-2"
                    />
                  </details>
                </div>
              )}
            </TabsContent>

            <TabsContent value="text" className="mt-4">
              <Textarea
                value={jobDescriptionText}
                onChange={(e) => setJobDescriptionText(e.target.value)}
                placeholder="Paste the job description here..."
                rows={12}
                required
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Any additional notes about this application</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any personal notes..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Job Application"
          )}
        </Button>
      </div>
    </form>
  )
}
