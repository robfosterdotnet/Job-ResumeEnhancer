"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { useTheme } from "@/components/settings/theme-provider"
import type { UserSettingsResponse, StorageStats, UpdateSettingsInput } from "@/lib/schemas/settings"

interface SettingsContextValue {
  settings: UserSettingsResponse | null
  storageStats: StorageStats | null
  isLoading: boolean
  error: string | null
  updateSettings: (updates: UpdateSettingsInput) => Promise<void>
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

interface SettingsProviderProps {
  children: React.ReactNode
  initialSettings?: UserSettingsResponse | null
  initialStorageStats?: StorageStats | null
}

export function SettingsProvider({
  children,
  initialSettings = null,
  initialStorageStats = null,
}: SettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettingsResponse | null>(initialSettings)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(initialStorageStats)
  const [isLoading, setIsLoading] = useState(!initialSettings)
  const [error, setError] = useState<string | null>(null)

  const theme = useTheme()
  const hasInitialized = useRef(false)

  // Fetch settings from API
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/settings")
      if (!response.ok) {
        throw new Error("Failed to fetch settings")
      }

      const data = await response.json()
      setSettings(data.settings)
      setStorageStats(data.storageStats)

      return data.settings
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load settings"
      setError(message)
      console.error("Error fetching settings:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update settings via API
  const updateSettings = useCallback(async (updates: UpdateSettingsInput) => {
    try {
      setError(null)

      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update settings")
      }

      const data = await response.json()
      setSettings(data.settings)

      // Sync theme settings to theme provider
      if (updates.theme !== undefined) {
        theme.setTheme(updates.theme)
      }
      if (updates.accentColor !== undefined) {
        theme.setAccentColor(updates.accentColor as "coral" | "blue" | "green" | "purple")
      }
      if (updates.uiDensity !== undefined) {
        theme.setUiDensity(updates.uiDensity)
      }
      if (updates.fontSize !== undefined) {
        theme.setFontSize(updates.fontSize)
      }
      if (updates.enableAnimations !== undefined) {
        theme.setEnableAnimations(updates.enableAnimations)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update settings"
      setError(message)
      throw err
    }
  }, [theme])

  // Refresh settings
  const refreshSettings = useCallback(async () => {
    await fetchSettings()
  }, [fetchSettings])

  // Initialize settings and sync theme on mount
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    const initializeSettings = async () => {
      const fetchedSettings = await fetchSettings()

      // Sync theme from settings to theme provider
      if (fetchedSettings) {
        if (fetchedSettings.theme) {
          theme.setTheme(fetchedSettings.theme)
        }
        if (fetchedSettings.accentColor) {
          theme.setAccentColor(fetchedSettings.accentColor as "coral" | "blue" | "green" | "purple")
        }
        if (fetchedSettings.uiDensity) {
          theme.setUiDensity(fetchedSettings.uiDensity)
        }
        if (fetchedSettings.fontSize) {
          theme.setFontSize(fetchedSettings.fontSize)
        }
        if (fetchedSettings.enableAnimations !== undefined) {
          theme.setEnableAnimations(fetchedSettings.enableAnimations)
        }
      }
    }

    initializeSettings()
  }, [fetchSettings, theme])

  return (
    <SettingsContext.Provider
      value={{
        settings,
        storageStats,
        isLoading,
        error,
        updateSettings,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
