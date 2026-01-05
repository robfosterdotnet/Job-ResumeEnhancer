"use client"

import { ThemeProvider } from "./theme-provider"
import { SettingsProvider } from "@/lib/contexts/settings-context"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </ThemeProvider>
  )
}
