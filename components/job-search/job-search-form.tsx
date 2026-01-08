"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"

interface JobSearchFormProps {
  onSearch: (query: string) => void
  isSearching: boolean
}

export function JobSearchForm({ onSearch, isSearching }: JobSearchFormProps) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="e.g., Entry Level Data Analyst Jobs in Nashville, TN"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          disabled={isSearching}
        />
      </div>
      <Button type="submit" disabled={isSearching || !query.trim()}>
        {isSearching ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="h-4 w-4 mr-2" />
            Search Jobs
          </>
        )}
      </Button>
    </form>
  )
}
