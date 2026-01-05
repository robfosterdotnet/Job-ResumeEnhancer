"use client"

import { useState, useCallback } from "react"
import { useSettings } from "@/lib/contexts/settings-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Eye, EyeOff, ExternalLink, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import type { UserSettingsResponse } from "@/lib/schemas/settings"

interface IntegrationsSectionProps {
  settings: UserSettingsResponse | null
}

export function IntegrationsSection({ settings }: IntegrationsSectionProps) {
  const { updateSettings } = useSettings()
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey, setApiKey] = useState(settings?.braveSearchApiKey || "")
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({})

  const saveApiKey = useCallback(async () => {
    setSaving(true)
    try {
      await updateSettings({ braveSearchApiKey: apiKey || null })
    } catch {
      // Error handled in context
    } finally {
      setSaving(false)
    }
  }, [apiKey, updateSettings])

  const testConnection = async (service: "brave" | "azure-openai") => {
    setTesting(service)
    try {
      const response = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service }),
      })

      const data = await response.json()
      setTestResults((prev) => ({
        ...prev,
        [service]: { success: data.success, message: data.message },
      }))
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [service]: { success: false, message: "Connection test failed" },
      }))
    } finally {
      setTesting(null)
    }
  }

  const maskApiKey = (key: string) => {
    if (!key) return ""
    if (key.length <= 8) return "****"
    return key.slice(0, 4) + "****" + key.slice(-4)
  }

  return (
    <div className="space-y-6">
      {/* Azure OpenAI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            AI Provider
            <Badge variant="secondary">Environment</Badge>
          </CardTitle>
          <CardDescription>
            Azure OpenAI is configured via environment variables for security.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium">Azure OpenAI (gpt-5.2)</p>
                <p className="text-sm text-muted-foreground">Configured via environment variables</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {testResults["azure-openai"] ? (
                testResults["azure-openai"].success ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Error
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Not tested
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => testConnection("azure-openai")}
                disabled={testing === "azure-openai"}
              >
                {testing === "azure-openai" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Test"
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            See the README for instructions on configuring Azure OpenAI credentials.
          </p>
        </CardContent>
      </Card>

      {/* Brave Search */}
      <Card>
        <CardHeader>
          <CardTitle>Web Search</CardTitle>
          <CardDescription>
            Configure the Brave Search API for company research. Falls back to DuckDuckGo if not set.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="braveApiKey">Brave Search API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="braveApiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Brave Search API key"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={saveApiKey} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>
            {settings?.braveSearchApiKey && (
              <p className="text-xs text-muted-foreground">
                Current key: {maskApiKey(settings.braveSearchApiKey)}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium">Brave Search</p>
                <p className="text-sm text-muted-foreground">
                  {settings?.braveSearchApiKey ? "API key configured" : "No API key set"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {testResults["brave"] ? (
                testResults["brave"].success ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Error
                  </Badge>
                )
              ) : settings?.braveSearchApiKey ? (
                <Badge variant="outline" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Not tested
                </Badge>
              ) : (
                <Badge variant="secondary">Not configured</Badge>
              )}
              {settings?.braveSearchApiKey && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testConnection("brave")}
                  disabled={testing === "brave"}
                >
                  {testing === "brave" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Test"
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted">
                <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium">DuckDuckGo</p>
                <p className="text-sm text-muted-foreground">Always available as fallback</p>
              </div>
            </div>
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Ready
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
            <a
              href="https://brave.com/search/api/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Get a Brave Search API key
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Future Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            These integrations are planned for future releases.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {["LinkedIn", "Google Calendar", "Notion"].map((integration) => (
            <div key={integration} className="flex items-center justify-between p-4 rounded-lg border border-dashed">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">
                  <div className="h-5 w-5 bg-muted-foreground/30 rounded" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">{integration}</p>
                  <p className="text-sm text-muted-foreground">Coming in a future update</p>
                </div>
              </div>
              <Badge variant="outline">Planned</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
