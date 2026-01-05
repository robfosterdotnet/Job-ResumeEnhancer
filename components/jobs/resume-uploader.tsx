"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface ResumeUploaderProps {
  jobId: number
  currentResume?: {
    id: number
    filename?: string | null
    fileType?: string | null
  }
  onSuccess?: () => void
}

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
]
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"]

export function ResumeUploader({ jobId, currentResume, onSuccess }: ResumeUploaderProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [pastedText, setPastedText] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const validateFile = (file: File): string | null => {
    // Check file type
    const extension = "." + file.name.split(".").pop()?.toLowerCase()
    if (!ACCEPTED_FILE_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(extension)) {
      return `Invalid file type. Please upload a Word document (.docx), PDF, or text file.`
    }
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return `File too large. Maximum size is 10MB.`
    }
    return null
  }

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/jobs/${jobId}/resume`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload resume")
      }

      setSuccess(`Successfully uploaded ${file.name}`)
      onSuccess?.()
      // Auto-refresh the page after a short delay to show success
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload resume")
    } finally {
      setLoading(false)
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await uploadFile(files[0])
    }
  }

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) {
      setError("Please paste your resume text")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/jobs/${jobId}/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save resume")
      }

      setSuccess("Resume saved successfully!")
      onSuccess?.()
      // Auto-refresh the page after a short delay to show success
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save resume")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Resume
          {currentResume && <CheckCircle className="h-5 w-5 text-success" />}
        </CardTitle>
        <CardDescription>
          {currentResume
            ? `Current: ${currentResume.filename || "Pasted text"} (${currentResume.fileType})`
            : "Upload your resume or paste the text"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-4 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-md bg-success/10 text-success text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="paste" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Paste Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p>Uploading...</p>
                </div>
              ) : isDragging ? (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-primary" />
                  <p className="font-medium text-primary">Drop your file here</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">Word (.docx), PDF, or TXT (max 10MB)</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="paste" className="mt-4 space-y-4">
            <Textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your resume text here..."
              rows={10}
            />
            <Button onClick={handlePasteSubmit} disabled={loading || !pastedText.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Resume"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
