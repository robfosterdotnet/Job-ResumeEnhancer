"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, User, ExternalLink } from "lucide-react"

interface LeadershipMember {
  id: number
  name: string
  title?: string | null
  role?: string | null
  bio?: string | null
  linkedinUrl?: string | null
}

interface LeadershipTeamProps {
  leaders: LeadershipMember[]
}

function getRoleBadgeColor(role: string): string {
  const roleLower = role.toLowerCase()
  if (roleLower.includes("ceo") || roleLower.includes("chief")) {
    return "bg-primary/10 text-primary border-primary/20"
  }
  if (roleLower.includes("founder")) {
    return "bg-blue-50 text-blue-700 border-blue-200"
  }
  if (roleLower.includes("board")) {
    return "bg-purple-50 text-purple-700 border-purple-200"
  }
  return "bg-muted text-muted-foreground"
}

export function LeadershipTeam({ leaders }: LeadershipTeamProps) {
  if (leaders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Leadership Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No leadership information available yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Leadership Team ({leaders.length})
        </CardTitle>
        <CardDescription>Key executives and board members</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaders.map((leader) => (
          <div
            key={leader.id}
            className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-foreground">{leader.name}</h4>
                  {leader.title && (
                    <p className="text-sm text-primary font-medium mt-0.5">{leader.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {leader.role && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${getRoleBadgeColor(leader.role)}`}
                    >
                      {leader.role}
                    </Badge>
                  )}
                  {leader.linkedinUrl && (
                    <a
                      href={leader.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
              {leader.bio && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {leader.bio}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
