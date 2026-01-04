"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Link as LinkIcon, FileText } from "lucide-react"

export function JobForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [error, setError] = useState("")

  const [title, setTitle] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState("")
  const [jobDescriptionText, setJobDescriptionText] = useState("")
  const [notes, setNotes] = useState("")

  const handleScrape = async () => {
    if (!jobDescriptionUrl) return

    setScraping(true)
    setError("")

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobDescriptionUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape URL")
      }

      setJobDescriptionText(data.description)
      if (data.title && !title) setTitle(data.title)
      if (data.company && !companyName) setCompanyName(data.company)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape URL")
    } finally {
      setScraping(false)
    }
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
          {error}
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
          <Tabs defaultValue="url" className="w-full">
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
                      Scraping...
                    </>
                  ) : (
                    "Fetch"
                  )}
                </Button>
              </div>
              {jobDescriptionText && (
                <Textarea
                  value={jobDescriptionText}
                  onChange={(e) => setJobDescriptionText(e.target.value)}
                  placeholder="Job description will appear here after fetching..."
                  rows={12}
                />
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
