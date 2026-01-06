"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileSearch,
  Building,
  MessageSquare,
  Play,
  FileEdit,
  Linkedin,
  Users,
} from "lucide-react"
import { ResumeUploader } from "@/components/jobs/resume-uploader"
import { ExportButton } from "@/components/jobs/export-button"

interface ActionsCardProps {
  jobId: number
  jobTitle: string
  initialHasResume: boolean
  initialHasAnalysis: boolean
  hasCompany: boolean
  interviewQuestionsCount: number
  currentResume?: {
    id: number
    filename?: string | null
    fileType?: string | null
  }
  children?: React.ReactNode // For the analysis summary card
}

export function ActionsCard({
  jobId,
  jobTitle,
  initialHasResume,
  initialHasAnalysis,
  hasCompany,
  interviewQuestionsCount,
  currentResume,
  children,
}: ActionsCardProps) {
  const [hasResume, setHasResume] = useState(initialHasResume)
  const hasAnalysis = initialHasAnalysis

  const handleResumeUploaded = () => {
    setHasResume(true)
  }

  return (
    <>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Analyze your application and research the company</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link href={`/jobs/${jobId}/resume-analysis`}>
            <Button disabled={!hasResume}>
              <FileSearch className="mr-2 h-4 w-4" />
              {hasAnalysis ? "View Analysis" : "Analyze Resume"}
            </Button>
          </Link>
          <Link href={`/jobs/${jobId}/company-research`}>
            <Button variant="outline" disabled={!hasCompany}>
              <Building className="mr-2 h-4 w-4" />
              Research Company
            </Button>
          </Link>
          <Link href={`/jobs/${jobId}/chat`}>
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
            </Button>
          </Link>
          <Link href={`/jobs/${jobId}/mock-interview`}>
            <Button variant="outline" disabled={!hasAnalysis || interviewQuestionsCount === 0}>
              <Play className="mr-2 h-4 w-4" />
              Mock Interview
            </Button>
          </Link>
          <Link href={`/jobs/${jobId}/interviewers`}>
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Interviewers
            </Button>
          </Link>
          <Link href={`/jobs/${jobId}/cover-letter`}>
            <Button variant="outline" disabled={!hasResume}>
              <FileEdit className="mr-2 h-4 w-4" />
              Cover Letter
            </Button>
          </Link>
          <Link href={`/jobs/${jobId}/linkedin`}>
            <Button variant="outline">
              <Linkedin className="mr-2 h-4 w-4" />
              LinkedIn Align
            </Button>
          </Link>
          <ExportButton jobId={jobId} jobTitle={jobTitle} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Resume Section */}
        <ResumeUploader
          jobId={jobId}
          currentResume={currentResume}
          onSuccess={handleResumeUploaded}
        />

        {/* Analysis Summary (passed as children) */}
        {children}
      </div>
    </>
  )
}
