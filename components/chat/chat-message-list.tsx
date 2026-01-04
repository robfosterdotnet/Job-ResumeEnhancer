"use client"

import { useEffect, useRef } from "react"
import { ChatMessage } from "./chat-message"
import { Loader2, MessageCircle } from "lucide-react"

interface Message {
  id?: number
  role: "user" | "assistant"
  content: string
  createdAt?: Date | null
}

interface ChatMessageListProps {
  messages: Message[]
  isLoading?: boolean
}

export function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Start a Conversation</h3>
        <p className="text-muted-foreground max-w-md">
          Ask questions about your resume analysis, company research, or get help
          preparing for your interview.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id || index}
          role={message.role}
          content={message.content}
          timestamp={message.createdAt}
        />
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="bg-muted rounded-lg px-4 py-2 inline-flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Thinking...</span>
              <Loader2 className="h-3 w-3 animate-spin" />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
