"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UserPlus, Loader2, ClipboardPaste, Linkedin } from "lucide-react"

const INTERVIEW_ROLES = [
  { value: "hiring_manager", label: "Hiring Manager" },
  { value: "technical", label: "Technical Interviewer" },
  { value: "hr", label: "HR / Recruiter" },
  { value: "peer", label: "Peer / Team Member" },
  { value: "executive", label: "Executive / Leadership" },
  { value: "other", label: "Other" },
]

interface AddInterviewerFormProps {
  onSubmit: (data: {
    name: string
    role: string
    interviewRole: string
    linkedInUrl: string
    linkedInContent: string
  }) => void
  isLoading?: boolean
}

export function AddInterviewerForm({ onSubmit, isLoading }: AddInterviewerFormProps) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [interviewRole, setInterviewRole] = useState("")
  const [linkedInUrl, setLinkedInUrl] = useState("")
  const [linkedInContent, setLinkedInContent] = useState("")

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setLinkedInContent(text)
    } catch {
      // Clipboard access denied - user will need to paste manually
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit({ name, role, interviewRole, linkedInUrl, linkedInContent })
      // Reset form
      setName("")
      setRole("")
      setInterviewRole("")
      setLinkedInUrl("")
      setLinkedInContent("")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add Interviewer
        </CardTitle>
        <CardDescription>
          Add people you&apos;ll be interviewing with. Paste their LinkedIn profile for AI-powered preparation insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Their Job Title</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Engineering Manager"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="interviewRole">Role in Interview</Label>
              <Select value={interviewRole} onValueChange={setInterviewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select their role..." />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedInUrl">LinkedIn URL (optional)</Label>
              <Input
                id="linkedInUrl"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                placeholder="https://linkedin.com/in/janesmith"
                type="url"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="linkedInContent" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                LinkedIn Profile Content
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={handlePaste}>
                <ClipboardPaste className="mr-2 h-4 w-4" />
                Paste from Clipboard
              </Button>
            </div>
            <Textarea
              id="linkedInContent"
              value={linkedInContent}
              onChange={(e) => setLinkedInContent(e.target.value)}
              placeholder="Go to their LinkedIn profile, select all (Ctrl/Cmd+A), copy (Ctrl/Cmd+C), and paste here..."
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Pasting LinkedIn content enables AI analysis of their background, expertise, and likely interview questions.
            </p>
          </div>

          <Button type="submit" disabled={!name.trim() || isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {linkedInContent ? "Analyzing..." : "Adding..."}
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                {linkedInContent ? "Add & Analyze Interviewer" : "Add Interviewer"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
