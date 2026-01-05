"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useSyncExternalStore, useRef } from "react"

type Theme = "light" | "dark" | "system"
type AccentColor = "coral" | "blue" | "green" | "purple"
type UiDensity = "compact" | "comfortable"
type FontSize = "small" | "medium" | "large"

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: "light" | "dark"
  accentColor: AccentColor
  uiDensity: UiDensity
  fontSize: FontSize
  enableAnimations: boolean
  setTheme: (theme: Theme) => void
  setAccentColor: (color: AccentColor) => void
  setUiDensity: (density: UiDensity) => void
  setFontSize: (size: FontSize) => void
  setEnableAnimations: (enabled: boolean) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEYS = {
  theme: "job-resume-enhancer-theme",
  accentColor: "job-resume-enhancer-accent",
  uiDensity: "job-resume-enhancer-density",
  fontSize: "job-resume-enhancer-font-size",
  enableAnimations: "job-resume-enhancer-animations",
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

// Hook to subscribe to system theme changes
function useSystemTheme(): "light" | "dark" {
  const subscribe = useCallback((callback: () => void) => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", callback)
    return () => mediaQuery.removeEventListener("change", callback)
  }, [])

  const getSnapshot = useCallback(() => getSystemTheme(), [])
  const getServerSnapshot = useCallback(() => "light" as const, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// Get initial value from localStorage (client-side only)
function getStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  const stored = localStorage.getItem(key)
  return stored !== null ? (stored as T) : defaultValue
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultAccentColor?: AccentColor
  defaultUiDensity?: UiDensity
  defaultFontSize?: FontSize
  defaultEnableAnimations?: boolean
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultAccentColor = "coral",
  defaultUiDensity = "comfortable",
  defaultFontSize = "medium",
  defaultEnableAnimations = true,
}: ThemeProviderProps) {
  // Lazy initialization - read from localStorage on first render
  const [theme, setThemeState] = useState<Theme>(() =>
    getStoredValue(STORAGE_KEYS.theme, defaultTheme) as Theme
  )
  const [accentColor, setAccentColorState] = useState<AccentColor>(() =>
    getStoredValue(STORAGE_KEYS.accentColor, defaultAccentColor) as AccentColor
  )
  const [uiDensity, setUiDensityState] = useState<UiDensity>(() =>
    getStoredValue(STORAGE_KEYS.uiDensity, defaultUiDensity) as UiDensity
  )
  const [fontSize, setFontSizeState] = useState<FontSize>(() =>
    getStoredValue(STORAGE_KEYS.fontSize, defaultFontSize) as FontSize
  )
  const [enableAnimations, setEnableAnimationsState] = useState(() => {
    if (typeof window === "undefined") return defaultEnableAnimations
    const stored = localStorage.getItem(STORAGE_KEYS.enableAnimations)
    return stored !== null ? stored === "true" : defaultEnableAnimations
  })
  const mountedRef = useRef(false)

  // Get system theme reactively
  const systemTheme = useSystemTheme()

  // Compute resolved theme without setState
  const resolvedTheme = useMemo<"light" | "dark">(() => {
    return theme === "system" ? systemTheme : theme
  }, [theme, systemTheme])

  // Apply theme to DOM
  useEffect(() => {
    // Skip on server
    if (typeof window === "undefined") return

    mountedRef.current = true
    const root = document.documentElement

    // Apply theme class
    root.classList.remove("light", "dark")
    if (theme !== "system") {
      root.classList.add(theme)
    }

    // Apply accent color
    if (accentColor !== "coral") {
      root.setAttribute("data-accent", accentColor)
    } else {
      root.removeAttribute("data-accent")
    }

    // Apply density
    root.setAttribute("data-density", uiDensity)

    // Apply font size
    root.setAttribute("data-font-size", fontSize)

    // Apply animations
    root.setAttribute("data-animations", String(enableAnimations))
  }, [theme, accentColor, uiDensity, fontSize, enableAnimations])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEYS.theme, newTheme)
  }, [])

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color)
    localStorage.setItem(STORAGE_KEYS.accentColor, color)
  }, [])

  const setUiDensity = useCallback((density: UiDensity) => {
    setUiDensityState(density)
    localStorage.setItem(STORAGE_KEYS.uiDensity, density)
  }, [])

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size)
    localStorage.setItem(STORAGE_KEYS.fontSize, size)
  }, [])

  const setEnableAnimations = useCallback((enabled: boolean) => {
    setEnableAnimationsState(enabled)
    localStorage.setItem(STORAGE_KEYS.enableAnimations, String(enabled))
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        accentColor,
        uiDensity,
        fontSize,
        enableAnimations,
        setTheme,
        setAccentColor,
        setUiDensity,
        setFontSize,
        setEnableAnimations,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
