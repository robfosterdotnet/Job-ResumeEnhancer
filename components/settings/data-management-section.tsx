"use client"

import { useState } from "react"
import { useSettings } from "@/lib/contexts/settings-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Download,
  Upload,
  Trash2,
  Loader2,
  FileJson,
  Briefcase,
  FileText,
  MessageSquare,
  Mic,
  AlertTriangle
} from "lucide-react"
import type { UserSettingsResponse } from "@/lib/schemas/settings"

interface DataManagementSectionProps {
  settings?: UserSettingsResponse | null
}

export function DataManagementSection(_props: DataManagementSectionProps) {
  const { storageStats, refreshSettings } = useSettings()
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [deleteScope, setDeleteScope] = useState<string | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch("/api/settings/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "json" }),
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `job-resume-enhancer-backup-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export data")
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const response = await fetch("/api/settings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Import failed")
      }

      const result = await response.json()
      alert(`Import successful! Imported ${result.imported.jobs || 0} jobs.`)
      await refreshSettings()
    } catch (error) {
      console.error("Import error:", error)
      alert(error instanceof Error ? error.message : "Failed to import data")
    } finally {
      setImporting(false)
      e.target.value = ""
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmation !== "DELETE") return
    if (!deleteScope) return

    try {
      const response = await fetch("/api/settings/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: deleteScope }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Delete failed")
      }

      alert(`Data deleted successfully`)
      setDeleteDialogOpen(false)
      setDeleteConfirmation("")
      setDeleteScope(null)
      await refreshSettings()
    } catch (error) {
      console.error("Delete error:", error)
      alert(error instanceof Error ? error.message : "Failed to delete data")
    }
  }

  const openDeleteDialog = (scope: string) => {
    setDeleteScope(scope)
    setDeleteConfirmation("")
    setDeleteDialogOpen(true)
  }

  const stats = storageStats || {
    jobCount: 0,
    resumeCount: 0,
    coverLetterCount: 0,
    chatSessionCount: 0,
    mockInterviewCount: 0,
  }

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Overview</CardTitle>
          <CardDescription>
            Summary of data stored in the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex flex-col items-center p-4 rounded-lg border">
              <Briefcase className="h-8 w-8 text-primary mb-2" />
              <span className="text-2xl font-bold">{stats.jobCount}</span>
              <span className="text-sm text-muted-foreground">Jobs</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg border">
              <FileText className="h-8 w-8 text-primary mb-2" />
              <span className="text-2xl font-bold">{stats.resumeCount}</span>
              <span className="text-sm text-muted-foreground">Resumes</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg border">
              <FileText className="h-8 w-8 text-primary mb-2" />
              <span className="text-2xl font-bold">{stats.coverLetterCount}</span>
              <span className="text-sm text-muted-foreground">Cover Letters</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg border">
              <MessageSquare className="h-8 w-8 text-primary mb-2" />
              <span className="text-2xl font-bold">{stats.chatSessionCount}</span>
              <span className="text-sm text-muted-foreground">Chat Sessions</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg border">
              <Mic className="h-8 w-8 text-primary mb-2" />
              <span className="text-2xl font-bold">{stats.mockInterviewCount}</span>
              <span className="text-sm text-muted-foreground">Interviews</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download all your data as a JSON backup file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50">
            <FileJson className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <p className="font-medium">Full Backup</p>
              <p className="text-sm text-muted-foreground">
                Jobs, resumes, analyses, research, cover letters, chat history, and interviews
              </p>
            </div>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Export does not include API keys or sensitive configuration.
          </p>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
          <CardDescription>
            Restore data from a previous backup file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg border border-dashed">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">Import from Backup</p>
              <p className="text-sm text-muted-foreground">
                Merge data from a JSON backup file
              </p>
            </div>
            <Button variant="outline" className="relative" disabled={importing}>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={importing}
              />
              {importing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Select File
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Imported data will be merged with existing data. Duplicates will be skipped.
          </p>
        </CardContent>
      </Card>

      {/* Clear Data */}
      <Card>
        <CardHeader>
          <CardTitle>Clear Data</CardTitle>
          <CardDescription>
            Selectively delete specific types of data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Chat History</p>
                <p className="text-sm text-muted-foreground">{stats.chatSessionCount} sessions</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDeleteDialog("chat")}
                disabled={stats.chatSessionCount === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Mock Interviews</p>
                <p className="text-sm text-muted-foreground">{stats.mockInterviewCount} sessions</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDeleteDialog("interviews")}
                disabled={stats.mockInterviewCount === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are irreversible. Please be certain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/5">
            <div>
              <p className="font-medium">Delete All Data</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete all jobs, resumes, analyses, and settings
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => openDeleteDialog("all")}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Everything
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              {deleteScope === "all"
                ? "This will permanently delete ALL your data including jobs, resumes, analyses, cover letters, chat history, and mock interviews."
                : deleteScope === "chat"
                ? "This will permanently delete all chat sessions and messages."
                : "This will permanently delete all mock interview sessions and responses."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              <strong>Warning:</strong> This action cannot be undone. All deleted data will be lost forever.
            </div>
            <div className="space-y-2">
              <Label htmlFor="deleteConfirm">
                Type <strong>DELETE</strong> to confirm:
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmation !== "DELETE"}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
