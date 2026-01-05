"use client"

import { useSettings } from "@/lib/contexts/settings-context"
import { useTheme } from "./theme-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Monitor, Sun, Moon, Check } from "lucide-react"
import type { UserSettingsResponse } from "@/lib/schemas/settings"

interface AppearanceSectionProps {
  settings?: UserSettingsResponse | null
}

const ACCENT_COLORS = [
  { value: "coral", label: "Coral", color: "#E5674C", description: "Anthropic brand" },
  { value: "blue", label: "Blue", color: "#3B82F6", description: "Classic blue" },
  { value: "green", label: "Green", color: "#10B981", description: "Fresh green" },
  { value: "purple", label: "Purple", color: "#8B5CF6", description: "Royal purple" },
]

export function AppearanceSection(_props: AppearanceSectionProps) {
  const { updateSettings } = useSettings()
  const theme = useTheme()

  const handleThemeChange = async (value: "light" | "dark" | "system") => {
    theme.setTheme(value)
    await updateSettings({ theme: value })
  }

  const handleAccentChange = async (value: "coral" | "blue" | "green" | "purple") => {
    theme.setAccentColor(value)
    await updateSettings({ accentColor: value })
  }

  const handleDensityChange = async (value: "compact" | "comfortable") => {
    theme.setUiDensity(value)
    await updateSettings({ uiDensity: value })
  }

  const handleFontSizeChange = async (value: "small" | "medium" | "large") => {
    theme.setFontSize(value)
    await updateSettings({ fontSize: value })
  }

  const handleAnimationsChange = async (enabled: boolean) => {
    theme.setEnableAnimations(enabled)
    await updateSettings({ enableAnimations: enabled })
  }

  return (
    <div className="space-y-6">
      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose how the application looks on your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={theme.theme}
            onValueChange={handleThemeChange}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="light" id="light-theme" className="peer sr-only" />
              <Label
                htmlFor="light-theme"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Sun className="mb-2 h-6 w-6" />
                <span className="font-medium">Light</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="dark" id="dark-theme" className="peer sr-only" />
              <Label
                htmlFor="dark-theme"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Moon className="mb-2 h-6 w-6" />
                <span className="font-medium">Dark</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="system" id="system-theme" className="peer sr-only" />
              <Label
                htmlFor="system-theme"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Monitor className="mb-2 h-6 w-6" />
                <span className="font-medium">System</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle>Accent Color</CardTitle>
          <CardDescription>
            Choose the primary color used throughout the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme.accentColor}
            onValueChange={handleAccentChange}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {ACCENT_COLORS.map((color) => (
              <div key={color.value}>
                <RadioGroupItem value={color.value} id={`color-${color.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`color-${color.value}`}
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-full mb-2 flex items-center justify-center"
                    style={{ backgroundColor: color.color }}
                  >
                    {theme.accentColor === color.value && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <span className="font-medium">{color.label}</span>
                  <span className="text-xs text-muted-foreground">{color.description}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle>Display Options</CardTitle>
          <CardDescription>
            Customize how content is displayed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Density */}
          <div className="space-y-3">
            <Label>UI Density</Label>
            <RadioGroup
              value={theme.uiDensity}
              onValueChange={handleDensityChange}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="compact" id="compact-density" className="peer sr-only" />
                <Label
                  htmlFor="compact-density"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Compact</span>
                  <span className="text-xs text-muted-foreground">More content, less spacing</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="comfortable" id="comfortable-density" className="peer sr-only" />
                <Label
                  htmlFor="comfortable-density"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Comfortable</span>
                  <span className="text-xs text-muted-foreground">Standard spacing</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <Label>Font Size</Label>
            <RadioGroup
              value={theme.fontSize}
              onValueChange={handleFontSizeChange}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="small" id="small-font" className="peer sr-only" />
                <Label
                  htmlFor="small-font"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-sm font-medium">Aa</span>
                  <span className="text-xs text-muted-foreground">Small</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="medium" id="medium-font" className="peer sr-only" />
                <Label
                  htmlFor="medium-font"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-base font-medium">Aa</span>
                  <span className="text-xs text-muted-foreground">Medium</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="large" id="large-font" className="peer sr-only" />
                <Label
                  htmlFor="large-font"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-lg font-medium">Aa</span>
                  <span className="text-xs text-muted-foreground">Large</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enableAnimations">Enable Animations</Label>
              <p className="text-sm text-muted-foreground">
                Show smooth transitions and effects
              </p>
            </div>
            <Switch
              id="enableAnimations"
              checked={theme.enableAnimations}
              onCheckedChange={handleAnimationsChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
