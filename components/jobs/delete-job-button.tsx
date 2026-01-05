"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2, Loader2 } from "lucide-react"

interface DeleteJobButtonProps {
  jobId: number
  jobTitle: string
  variant?: "default" | "ghost" | "outline" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  showText?: boolean
  onDeleted?: () => void
}

export function DeleteJobButton({
  jobId,
  jobTitle,
  variant = "outline",
  size = "sm",
  showText = true,
  onDeleted,
}: DeleteJobButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete job")
      }

      setOpen(false)

      if (onDeleted) {
        onDeleted()
      } else {
        // Redirect to jobs list
        router.push("/jobs")
        router.refresh()
      }
    } catch (error) {
      console.error("Error deleting job:", error)
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant={variant}
        size={size}
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />
        {showText && "Delete"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Job Application</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{jobTitle}&quot;? This action cannot be undone.
            All associated data including resumes, analyses, cover letters, and chat history will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
