"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Upload } from "lucide-react"
import Link from "next/link"

interface ResumeSelectPromptProps {
  onUploadClick?: () => void
}

export function ResumeSelectPrompt({ onUploadClick }: ResumeSelectPromptProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Resume Required for Fit Scoring</h3>
        <p className="text-muted-foreground max-w-md mb-4">
          To calculate how well you match each job, we need your resume. Upload a resume
          to see personalized fit scores.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings">
              <FileText className="h-4 w-4 mr-2" />
              Manage Resumes
            </Link>
          </Button>
          {onUploadClick && (
            <Button onClick={onUploadClick}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Resume
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
