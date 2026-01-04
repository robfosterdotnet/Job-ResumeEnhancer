"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, Loader2, FileJson, FileText, CheckCircle } from "lucide-react"

interface ExportButtonProps {
  jobId: number
  jobTitle: string
}

export function ExportButton({ jobId, jobTitle }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const handleExport = async (format: "json" | "markdown") => {
    setLoading(true)
    setSuccess(null)

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobApplicationId: jobId,
          format,
        }),
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      const filename = `${jobTitle.replace(/[^a-z0-9]/gi, "_")}_report.${
        format === "json" ? "json" : "md"
      }`

      if (format === "json") {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        })
        downloadBlob(blob, filename)
      } else {
        const text = await response.text()
        const blob = new Blob([text], { type: "text/markdown" })
        downloadBlob(blob, filename)
      }

      setSuccess(format)
      setTimeout(() => setSuccess(null), 2000)
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export report. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : success ? (
            <CheckCircle className="mr-2 h-4 w-4 text-success" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {success ? "Downloaded!" : "Export Report"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("markdown")}>
          <FileText className="mr-2 h-4 w-4" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJson className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
