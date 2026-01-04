"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChatMessageList } from "./chat-message-list"
import { ChatInput } from "./chat-input"
import { MessageCircle } from "lucide-react"

interface Message {
  id?: number
  role: "user" | "assistant"
  content: string
  createdAt?: Date | null
}

interface ChatInterfaceProps {
  jobApplicationId: number
  sessionId?: number
  initialMessages?: Message[]
}

const defaultSuggestions = [
  "What are my main strengths for this role?",
  "What skills should I emphasize in my interview?",
  "Tell me about the company culture",
  "What questions should I prepare for?",
  "How can I improve my resume?",
]

export function ChatInterface({
  jobApplicationId,
  sessionId,
  initialMessages = [],
}: ChatInterfaceProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState(sessionId)

  // Sync state when session changes (e.g., clicking previous chats)
  useEffect(() => {
    setMessages(initialMessages)
    setCurrentSessionId(sessionId)
  }, [sessionId, initialMessages])

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        role: "user",
        content,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobApplicationId,
            sessionId: currentSessionId,
            message: content,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to send message")
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error("No response stream")
        }

        const decoder = new TextDecoder()
        let assistantContent = ""
        let buffer = ""

        // Add placeholder for assistant message
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "", createdAt: new Date() },
        ])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") {
                break
              }

              try {
                const event = JSON.parse(data)
                if (event.type === "session") {
                  setCurrentSessionId(event.sessionId)
                } else if (event.type === "chunk") {
                  assistantContent += event.content || ""
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1] = {
                      role: "assistant",
                      content: assistantContent,
                      createdAt: new Date(),
                    }
                    return newMessages
                  })
                } else if (event.type === "complete") {
                  // Final update - stream complete
                  setCurrentSessionId(event.sessionId)
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1] = {
                      role: "assistant",
                      content: assistantContent,
                      createdAt: new Date(),
                    }
                    return newMessages
                  })
                } else if (event.type === "error") {
                  throw new Error(event.error || "Unknown error")
                }
              } catch (parseError) {
                // Only throw if it's an actual error we created
                if (parseError instanceof Error && parseError.message !== "Unexpected token") {
                  throw parseError
                }
              }
            }
          }
        }

        // Refresh to update session in URL if needed
        if (!sessionId && currentSessionId) {
          router.refresh()
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message"
        setMessages((prev) => [
          ...prev.slice(0, -1), // Remove the placeholder
          {
            role: "assistant",
            content: `Sorry, I encountered an error: ${errorMessage}`,
            createdAt: new Date(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [jobApplicationId, currentSessionId, sessionId, router]
  )

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Chat Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ChatMessageList messages={messages} isLoading={isLoading} />
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          suggestions={messages.length === 0 ? defaultSuggestions : []}
        />
      </CardContent>
    </Card>
  )
}
