"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Download, Mic, MessageSquare } from "lucide-react"

interface QuickActionsProps {
  onExportAll?: () => void
}

export function QuickActions({ onExportAll }: QuickActionsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 md:hidden z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        <Link href="/jobs/new">
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-xs">New Job</span>
          </Button>
        </Link>
        <Link href="/jobs">
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
            <Mic className="h-5 w-5 mb-1" />
            <span className="text-xs">Practice</span>
          </Button>
        </Link>
        <Link href="/jobs">
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
            <MessageSquare className="h-5 w-5 mb-1" />
            <span className="text-xs">Chat</span>
          </Button>
        </Link>
        {onExportAll && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto py-2"
            onClick={onExportAll}
          >
            <Download className="h-5 w-5 mb-1" />
            <span className="text-xs">Export</span>
          </Button>
        )}
      </div>
    </div>
  )
}

// Desktop version - floating buttons at top
export function QuickActionsDesktop() {
  return (
    <div className="hidden md:flex gap-2 items-center">
      <Link href="/jobs/new">
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </Link>
      <Link href="/jobs">
        <Button variant="outline" size="sm">
          View All Jobs
        </Button>
      </Link>
    </div>
  )
}
