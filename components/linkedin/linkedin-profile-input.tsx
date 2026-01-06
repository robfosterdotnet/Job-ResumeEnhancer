"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Linkedin, ClipboardPaste, Loader2, AlertCircle } from "lucide-react"

interface LinkedInProfileInputProps {
  onSubmit: (data: {
    profileContent: string
    targetRole: string
    targetIndustry: string
  }) => void
  isLoading?: boolean
  initialTargetRole?: string
  initialTargetIndustry?: string
}

export function LinkedInProfileInput({
  onSubmit,
  isLoading,
  initialTargetRole = "",
  initialTargetIndustry = "",
}: LinkedInProfileInputProps) {
  const [profileContent, setProfileContent] = useState("")
  const [targetRole, setTargetRole] = useState(initialTargetRole)
  const [targetIndustry, setTargetIndustry] = useState(initialTargetIndustry)
  const [pasteError, setPasteError] = useState("")

  const handlePaste = async () => {
    setPasteError("")
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setProfileContent(text)
      } else {
        setPasteError("Clipboard is empty")
      }
    } catch {
      setPasteError("Unable to access clipboard. Please paste manually.")
    }
  }

  const handleSubmit = () => {
    if (!profileContent.trim()) return
    onSubmit({ profileContent, targetRole, targetIndustry })
  }

  const wordCount = profileContent.trim().split(/\s+/).filter(Boolean).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Linkedin className="h-5 w-5 text-[#0A66C2]" />
          LinkedIn Profile Optimizer
        </CardTitle>
        <CardDescription>
          Copy your LinkedIn profile content and paste it below for AI-powered
          optimization suggestions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 text-sm text-blue-800 dark:text-blue-200">
          <strong>How to copy your profile:</strong>
          <ol className="mt-2 list-decimal list-inside space-y-1">
            <li>Go to your LinkedIn profile page</li>
            <li>Select all content (Ctrl/Cmd + A)</li>
            <li>Copy (Ctrl/Cmd + C)</li>
            <li>Paste below or click the paste button</li>
          </ol>
        </div>

        {/* Profile Content Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="profile-content">Profile Content</Label>
            <div className="flex items-center gap-2">
              {wordCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {wordCount} words
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handlePaste}>
                <ClipboardPaste className="mr-2 h-4 w-4" />
                Paste from Clipboard
              </Button>
            </div>
          </div>
          <Textarea
            id="profile-content"
            value={profileContent}
            onChange={(e) => setProfileContent(e.target.value)}
            placeholder="Paste your LinkedIn profile content here...

Example:
John Smith
Senior Software Engineer at Tech Company
San Francisco Bay Area

About
Passionate software engineer with 10+ years of experience...

Experience
Senior Software Engineer
Tech Company
Jan 2020 - Present · 4 years

Skills
JavaScript · React · Node.js · TypeScript"
            rows={12}
            className="font-mono text-sm"
          />
          {pasteError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {pasteError}
            </div>
          )}
        </div>

        {/* Target Role & Industry */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="target-role">Target Role (Optional)</Label>
            <Input
              id="target-role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
            />
            <p className="text-xs text-muted-foreground">
              Specify your target role for tailored suggestions
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-industry">Target Industry (Optional)</Label>
            <Input
              id="target-industry"
              value={targetIndustry}
              onChange={(e) => setTargetIndustry(e.target.value)}
              placeholder="e.g., Technology, Finance"
            />
            <p className="text-xs text-muted-foreground">
              Industry context helps optimize keywords
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!profileContent.trim() || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Profile...
            </>
          ) : (
            <>
              <Linkedin className="mr-2 h-4 w-4" />
              Analyze Profile
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
