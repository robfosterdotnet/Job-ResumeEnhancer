import { notFound } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { jobApplications, chatSessions, chatMessages } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { ArrowLeft, Plus, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ChatInterface } from "@/components/chat"

type PageProps = {
  params: Promise<{ jobId: string }>
  searchParams: Promise<{ session?: string }>
}

async function getJob(jobId: number) {
  return db.query.jobApplications.findFirst({
    where: eq(jobApplications.id, jobId),
    with: {
      company: true,
    },
  })
}

async function getChatSessions(jobApplicationId: number) {
  return db.query.chatSessions.findMany({
    where: eq(chatSessions.jobApplicationId, jobApplicationId),
    orderBy: [desc(chatSessions.createdAt)],
  })
}

async function getChatMessages(sessionId: number) {
  return db.query.chatMessages.findMany({
    where: eq(chatMessages.sessionId, sessionId),
    orderBy: [chatMessages.createdAt],
  })
}

export default async function ChatPage({ params, searchParams }: PageProps) {
  const { jobId } = await params
  const { session: sessionParam } = await searchParams
  const id = parseInt(jobId, 10)

  if (isNaN(id)) {
    notFound()
  }

  const job = await getJob(id)

  if (!job) {
    notFound()
  }

  const sessions = await getChatSessions(job.id)
  const activeSessionId = sessionParam ? parseInt(sessionParam, 10) : undefined
  const messages = activeSessionId
    ? await getChatMessages(activeSessionId)
    : []

  return (
    <div className="flex flex-col h-full">
      <Header title="Chat Assistant" />

      <div className="flex-1 p-6 flex gap-6 min-h-0">
        {/* Sidebar - Chat Sessions */}
        <div className="w-64 flex-shrink-0 space-y-4">
          {/* Back Link */}
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {job.title}
          </Link>

          {/* New Chat Button */}
          <Link href={`/jobs/${job.id}/chat`}>
            <Button className="w-full" variant={!activeSessionId ? "default" : "outline"}>
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </Link>

          {/* Session List */}
          {sessions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Previous Chats
              </h3>
              <div className="space-y-1">
                {sessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/jobs/${job.id}/chat?session=${session.id}`}
                    className={`block p-3 rounded-lg border transition-colors ${
                      activeSessionId === session.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <p className="text-sm font-medium truncate">
                      {session.title || "Chat Session"}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(session.createdAt!, { addSuffix: true })}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 min-w-0">
          <ChatInterface
            jobApplicationId={job.id}
            sessionId={activeSessionId}
            initialMessages={messages.map((m) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              createdAt: m.createdAt,
            }))}
          />
        </div>
      </div>
    </div>
  )
}
