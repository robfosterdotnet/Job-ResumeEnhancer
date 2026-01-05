"use client"

import { useSettings } from "@/lib/contexts/settings-context"
import { ProfileSection } from "./profile-section"
import { AIPreferencesSection } from "./ai-preferences-section"
import { AppearanceSection } from "./appearance-section"
import { DataManagementSection } from "./data-management-section"
import { IntegrationsSection } from "./integrations-section"
import { NotificationsSection } from "./notifications-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bot, Palette, Database, Key, Bell } from "lucide-react"

export function SettingsForm() {
  const { settings, isLoading, error } = useSettings()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-destructive/10 text-destructive">
        <p>Error loading settings: {error}</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
        <TabsTrigger value="profile" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </TabsTrigger>
        <TabsTrigger value="ai" className="gap-2">
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">AI Preferences</span>
        </TabsTrigger>
        <TabsTrigger value="appearance" className="gap-2">
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Appearance</span>
        </TabsTrigger>
        <TabsTrigger value="data" className="gap-2">
          <Database className="h-4 w-4" />
          <span className="hidden sm:inline">Data</span>
        </TabsTrigger>
        <TabsTrigger value="integrations" className="gap-2">
          <Key className="h-4 w-4" />
          <span className="hidden sm:inline">Integrations</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileSection settings={settings} />
      </TabsContent>

      <TabsContent value="ai">
        <AIPreferencesSection settings={settings} />
      </TabsContent>

      <TabsContent value="appearance">
        <AppearanceSection settings={settings} />
      </TabsContent>

      <TabsContent value="data">
        <DataManagementSection settings={settings} />
      </TabsContent>

      <TabsContent value="integrations">
        <IntegrationsSection settings={settings} />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationsSection settings={settings} />
      </TabsContent>
    </Tabs>
  )
}
