"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Edit, Save, X, RotateCcw, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

interface CoverLetterViewerProps {
  letter: CoverLetter
  onSave: (id: number, content: string) => Promise<void>
}

export function CoverLetterViewer({ letter, onSave }: CoverLetterViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Get the display content
  const displayContent = letter.isEdited && letter.editedContent
    ? letter.editedContent
    : letter.fullContent

  // Reset edit content when letter changes
  useEffect(() => {
    setEditContent(displayContent)
    setIsEditing(false)
  }, [letter.id, displayContent])

  const handleStartEdit = () => {
    setEditContent(displayContent)
    setIsEditing(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(letter.id, editContent)
      setIsEditing(false)
    } catch {
      alert("Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditContent(displayContent)
    setIsEditing(false)
  }

  const handleRevert = () => {
    setEditContent(letter.fullContent)
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            Version {letter.versionNumber}
            {letter.isEdited && (
              <Badge variant="secondary" className="text-xs">
                Edited
              </Badge>
            )}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{toneLabels[letter.tone]}</Badge>
            <Badge variant="outline">{lengthLabels[letter.length]}</Badge>
            {letter.createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDistanceToNow(letter.createdAt, { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {isEditing ? (
            <>
              {letter.isEdited && editContent !== letter.fullContent && (
                <Button variant="outline" size="sm" onClick={handleRevert}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Revert
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[500px] font-mono text-sm leading-relaxed"
          />
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed prose prose-sm max-w-none">
            {displayContent}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
