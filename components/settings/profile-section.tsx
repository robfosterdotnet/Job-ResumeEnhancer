"use client"

import { useState, useCallback } from "react"
import { useSettings } from "@/lib/contexts/settings-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Check, Loader2 } from "lucide-react"
import type { UserSettingsResponse } from "@/lib/schemas/settings"

interface ProfileSectionProps {
  settings: UserSettingsResponse | null
}

export function ProfileSection({ settings }: ProfileSectionProps) {
  const { updateSettings } = useSettings()
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Debounced save function
  const saveField = useCallback(async (field: string, value: string | null) => {
    setSaving(field)
    try {
      await updateSettings({ [field]: value || null })
    } catch {
      // Error handled in context
    } finally {
      setTimeout(() => setSaving(null), 500)
    }
  }, [updateSettings])

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/settings/master-resume", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload resume")
      }

      // Refresh settings to get new master resume
      window.location.reload()
    } catch (error) {
      console.error("Upload error:", error)
      alert(error instanceof Error ? error.message : "Failed to upload resume")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Your profile information is used to auto-fill cover letters and personalize recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <Input
                  id="fullName"
                  defaultValue={settings?.fullName || ""}
                  placeholder="John Doe"
                  onBlur={(e) => saveField("fullName", e.target.value)}
                />
                {saving === "fullName" && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-success" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  defaultValue={settings?.email || ""}
                  placeholder="john@example.com"
                  onBlur={(e) => saveField("email", e.target.value)}
                />
                {saving === "email" && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-success" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  defaultValue={settings?.phone || ""}
                  placeholder="(555) 123-4567"
                  onBlur={(e) => saveField("phone", e.target.value)}
                />
                {saving === "phone" && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-success" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <div className="relative">
                <Input
                  id="linkedinUrl"
                  type="url"
                  defaultValue={settings?.linkedinUrl || ""}
                  placeholder="https://linkedin.com/in/johndoe"
                  onBlur={(e) => saveField("linkedinUrl", e.target.value)}
                />
                {saving === "linkedinUrl" && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-success" />
                )}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="portfolioUrl">Portfolio URL</Label>
              <div className="relative">
                <Input
                  id="portfolioUrl"
                  type="url"
                  defaultValue={settings?.portfolioUrl || ""}
                  placeholder="https://johndoe.com"
                  onBlur={(e) => saveField("portfolioUrl", e.target.value)}
                />
                {saving === "portfolioUrl" && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-success" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Master Resume</CardTitle>
          <CardDescription>
            Upload a master resume to use as the default when creating new job applications.
            This should be your most comprehensive resume.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.masterResume ? (
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{settings.masterResume.filename || "Master Resume"}</p>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(settings.masterResume.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-lg border border-dashed">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium text-muted-foreground">No master resume set</p>
                <p className="text-sm text-muted-foreground">
                  Upload a resume to use as your default
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button variant="outline" className="relative" disabled={uploading}>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleUploadResume}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {settings?.masterResume ? "Replace Resume" : "Upload Resume"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, DOCX, TXT. Maximum size: 10MB
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
