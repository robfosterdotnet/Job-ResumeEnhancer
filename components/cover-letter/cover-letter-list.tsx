"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Copy, Download, Trash2, Check, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { CoverLetterViewer } from "./cover-letter-viewer"
import { copyToClipboard } from "@/lib/utils/clipboard"

interface CoverLetter {
  id: number
  tone: "formal" | "conversational" | "enthusiastic"
  length: "short" | "medium" | "long"
  fullContent: string
  editedContent: string | null
  isEdited: boolean
  versionNumber: number
  createdAt: Date | null
}

interface CoverLetterListProps {
  initialLetters: CoverLetter[]
  jobId: number
}

export function CoverLetterList({ initialLetters }: CoverLetterListProps) {
  const router = useRouter()
  const [letters, setLetters] = useState(initialLetters)
  const [selectedId, setSelectedId] = useState<number | null>(
    initialLetters[0]?.id || null
  )
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [copyErrorId, setCopyErrorId] = useState<number | null>(null)

  const selectedLetter = letters.find((l) => l.id === selectedId)

  const handleCopy = async (letter: CoverLetter) => {
    const content = letter.isEdited && letter.editedContent
      ? letter.editedContent
      : letter.fullContent
    const success = await copyToClipboard(content)
    if (success) {
      setCopiedId(letter.id)
      setCopyErrorId(null)
      setTimeout(() => setCopiedId(null), 2000)
    } else {
      setCopyErrorId(letter.id)
      setTimeout(() => setCopyErrorId(null), 2000)
    }
  }

  const handleDownload = (letter: CoverLetter) => {
    const content = letter.isEdited && letter.editedContent
      ? letter.editedContent
      : letter.fullContent
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cover-letter-v${letter.versionNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this cover letter?")) return

    try {
      const response = await fetch(`/api/agents/cover-letter/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")
      setLetters((prev) => prev.filter((l) => l.id !== id))
      if (selectedId === id) {
        const remaining = letters.filter((l) => l.id !== id)
        setSelectedId(remaining[0]?.id || null)
      }
      router.refresh()
    } catch (error) {
      console.error("Delete error:", error)
      alert("Failed to delete cover letter")
    }
  }

  const handleSaveEdit = async (id: number, content: string) => {
    const response = await fetch(`/api/agents/cover-letter/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editedContent: content }),
    })
    if (!response.ok) throw new Error("Failed to save")

    setLetters((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, editedContent: content, isEdited: true } : l
      )
    )
  }

  const toneLabels = {
    formal: "Formal",
    conversational: "Conversational",
    enthusiastic: "Enthusiastic",
  }

  const lengthLabels = {
    short: "Short",
    medium: "Medium",
    long: "Long",
  }

  if (letters.length === 0) {
    return null
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Version List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Versions ({letters.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {letters.map((letter) => (
            <div
              key={letter.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedId === letter.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedId(letter.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">Version {letter.versionNumber}</span>
                    {letter.isEdited && (
                      <Badge variant="secondary" className="text-xs">
                        Edited
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {toneLabels[letter.tone]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {lengthLabels[letter.length]}
                    </Badge>
                  </div>
                  {letter.createdAt && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(letter.createdAt, { addSuffix: true })}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(letter)
                    }}
                    title="Copy to clipboard"
                  >
                    {copiedId === letter.id ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : copyErrorId === letter.id ? (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(letter)
                    }}
                    title="Download as text file"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(letter.id)
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Viewer/Editor */}
      <div className="lg:col-span-2">
        {selectedLetter ? (
          <CoverLetterViewer
            letter={selectedLetter}
            onSave={handleSaveEdit}
          />
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Select a version to view</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
