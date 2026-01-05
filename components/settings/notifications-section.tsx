"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, Calendar, Mail } from "lucide-react"
import type { UserSettingsResponse } from "@/lib/schemas/settings"

interface NotificationsSectionProps {
  settings: UserSettingsResponse | null
}

export function NotificationsSection({ settings }: NotificationsSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure reminders and alerts for your job search.
              </CardDescription>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Notification features are planned for a future release. Preview the planned features below.
          </p>

          {/* Follow-up Reminders - Disabled */}
          <div className="rounded-lg border p-4 opacity-60">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <Label className="text-base">Follow-up Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to follow up on applications
                  </p>
                </div>
              </div>
              <Switch disabled checked={settings?.enableFollowUpReminders ?? false} />
            </div>
            <div className="pl-11 space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="followUpDays" className="text-sm">Remind after</Label>
                <Input
                  id="followUpDays"
                  type="number"
                  min={1}
                  max={14}
                  defaultValue={settings?.followUpReminderDays || 7}
                  className="w-20"
                  disabled
                />
                <span className="text-sm text-muted-foreground">days with no response</span>
              </div>
            </div>
          </div>

          {/* Interview Prep Reminders - Disabled */}
          <div className="rounded-lg border p-4 opacity-60">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <Label className="text-base">Interview Prep Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to practice before interviews
                  </p>
                </div>
              </div>
              <Switch disabled checked={settings?.enableInterviewReminders ?? false} />
            </div>
            <div className="pl-11 space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="interviewHours" className="text-sm">Remind</Label>
                <Input
                  id="interviewHours"
                  type="number"
                  min={1}
                  max={72}
                  defaultValue={settings?.interviewReminderHours || 24}
                  className="w-20"
                  disabled
                />
                <span className="text-sm text-muted-foreground">hours before scheduled interview</span>
              </div>
            </div>
          </div>

          {/* Weekly Digest - Disabled */}
          <div className="rounded-lg border p-4 opacity-60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <Label className="text-base">Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly email summary of your job search progress
                  </p>
                </div>
              </div>
              <Switch disabled />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <strong>Note:</strong> These features require browser notification permissions and/or email configuration.
            They will be available in a future update.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
