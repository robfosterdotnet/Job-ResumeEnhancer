"use client"

import { useState, useCallback } from "react"
import { useSettings } from "@/lib/contexts/settings-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Check } from "lucide-react"
import type { UserSettingsResponse } from "@/lib/schemas/settings"

interface AIPreferencesSectionProps {
  settings: UserSettingsResponse | null
}

export function AIPreferencesSection({ settings }: AIPreferencesSectionProps) {
  const { updateSettings } = useSettings()
  const [saving, setSaving] = useState<string | null>(null)

  const saveField = useCallback(async (field: string, value: unknown) => {
    setSaving(field)
    try {
      await updateSettings({ [field]: value })
    } catch {
      // Error handled in context
    } finally {
      setTimeout(() => setSaving(null), 500)
    }
  }, [updateSettings])

  return (
    <div className="space-y-6">
      {/* Resume Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Resume Analysis</CardTitle>
          <CardDescription>
            Configure how the AI analyzes your resume against job descriptions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Analysis Depth</Label>
              {saving === "analysisDepth" && <Check className="h-4 w-4 text-success" />}
            </div>
            <RadioGroup
              defaultValue={settings?.analysisDepth || "standard"}
              onValueChange={(value) => saveField("analysisDepth", value)}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="quick" id="quick" className="peer sr-only" />
                <Label
                  htmlFor="quick"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Quick</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Fast overview
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="standard" id="standard" className="peer sr-only" />
                <Label
                  htmlFor="standard"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Standard</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Balanced analysis
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="comprehensive" id="comprehensive" className="peer sr-only" />
                <Label
                  htmlFor="comprehensive"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Comprehensive</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Deep dive
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="interviewQuestionCount">Interview Questions Generated</Label>
              {saving === "interviewQuestionCount" && <Check className="h-4 w-4 text-success" />}
            </div>
            <div className="flex items-center gap-4">
              <Input
                id="interviewQuestionCount"
                type="number"
                min={5}
                max={25}
                defaultValue={settings?.interviewQuestionCount || 15}
                className="w-24"
                onBlur={(e) => {
                  const value = Math.min(25, Math.max(5, parseInt(e.target.value, 10) || 15))
                  saveField("interviewQuestionCount", value)
                }}
              />
              <span className="text-sm text-muted-foreground">questions (5-25)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cover Letter */}
      <Card>
        <CardHeader>
          <CardTitle>Cover Letter Generation</CardTitle>
          <CardDescription>
            Default settings for generating cover letters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Default Tone</Label>
              {saving === "coverLetterTone" && <Check className="h-4 w-4 text-success" />}
            </div>
            <RadioGroup
              defaultValue={settings?.coverLetterTone || "conversational"}
              onValueChange={(value) => saveField("coverLetterTone", value)}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="formal" id="formal-tone" className="peer sr-only" />
                <Label
                  htmlFor="formal-tone"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Formal</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Professional
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="conversational" id="conversational-tone" className="peer sr-only" />
                <Label
                  htmlFor="conversational-tone"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Conversational</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Friendly
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="enthusiastic" id="enthusiastic-tone" className="peer sr-only" />
                <Label
                  htmlFor="enthusiastic-tone"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Enthusiastic</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Energetic
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Default Length</Label>
              {saving === "coverLetterLength" && <Check className="h-4 w-4 text-success" />}
            </div>
            <RadioGroup
              defaultValue={settings?.coverLetterLength || "medium"}
              onValueChange={(value) => saveField("coverLetterLength", value)}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="short" id="short-length" className="peer sr-only" />
                <Label
                  htmlFor="short-length"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Short</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    ~200 words
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="medium" id="medium-length" className="peer sr-only" />
                <Label
                  htmlFor="medium-length"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Medium</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    ~350 words
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="long" id="long-length" className="peer sr-only" />
                <Label
                  htmlFor="long-length"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Long</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    ~500 words
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="coverLetterUseAnalysis">Use Resume Analysis Insights</Label>
              <p className="text-sm text-muted-foreground">
                Incorporate strengths and keywords from resume analysis
              </p>
            </div>
            <Switch
              id="coverLetterUseAnalysis"
              defaultChecked={settings?.coverLetterUseAnalysis ?? true}
              onCheckedChange={(checked) => saveField("coverLetterUseAnalysis", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Company Research */}
      <Card>
        <CardHeader>
          <CardTitle>Company Research</CardTitle>
          <CardDescription>
            Configure how the AI researches companies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Research Depth</Label>
            {saving === "researchDepth" && <Check className="h-4 w-4 text-success" />}
          </div>
          <RadioGroup
            defaultValue={settings?.researchDepth || "standard"}
            onValueChange={(value) => saveField("researchDepth", value)}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="basic" id="basic-research" className="peer sr-only" />
              <Label
                htmlFor="basic-research"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <span className="font-medium">Basic</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Overview only
                </span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="standard" id="standard-research" className="peer sr-only" />
              <Label
                htmlFor="standard-research"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <span className="font-medium">Standard</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Full research
                </span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="comprehensive" id="comprehensive-research" className="peer sr-only" />
              <Label
                htmlFor="comprehensive-research"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <span className="font-medium">Comprehensive</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Deep analysis
                </span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Mock Interview */}
      <Card>
        <CardHeader>
          <CardTitle>Mock Interview</CardTitle>
          <CardDescription>
            Default settings for mock interview practice sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="mockInterviewQuestionCount">Default Question Count</Label>
                {saving === "mockInterviewQuestionCount" && <Check className="h-4 w-4 text-success" />}
              </div>
              <div className="flex items-center gap-4">
                <Input
                  id="mockInterviewQuestionCount"
                  type="number"
                  min={5}
                  max={20}
                  defaultValue={settings?.mockInterviewQuestionCount || 10}
                  className="w-24"
                  onBlur={(e) => {
                    const value = Math.min(20, Math.max(5, parseInt(e.target.value, 10) || 10))
                    saveField("mockInterviewQuestionCount", value)
                  }}
                />
                <span className="text-sm text-muted-foreground">questions (5-20)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Default Difficulty</Label>
                {saving === "mockInterviewDifficulty" && <Check className="h-4 w-4 text-success" />}
              </div>
              <RadioGroup
                defaultValue={settings?.mockInterviewDifficulty || "mid"}
                onValueChange={(value) => saveField("mockInterviewDifficulty", value)}
                className="flex flex-wrap gap-2"
              >
                {["entry", "mid", "senior", "executive"].map((level) => (
                  <div key={level}>
                    <RadioGroupItem value={level} id={`difficulty-${level}`} className="peer sr-only" />
                    <Label
                      htmlFor={`difficulty-${level}`}
                      className="inline-flex items-center justify-center rounded-md border-2 border-muted bg-popover px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Feedback Mode</Label>
              {saving === "mockInterviewFeedbackMode" && <Check className="h-4 w-4 text-success" />}
            </div>
            <RadioGroup
              defaultValue={settings?.mockInterviewFeedbackMode || "immediate"}
              onValueChange={(value) => saveField("mockInterviewFeedbackMode", value)}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="immediate" id="immediate-feedback" className="peer sr-only" />
                <Label
                  htmlFor="immediate-feedback"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Immediate</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Feedback after each question
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="summary" id="summary-feedback" className="peer sr-only" />
                <Label
                  htmlFor="summary-feedback"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Summary</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    All feedback at the end
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mockInterviewVoiceEnabled">Enable Voice Input/Output</Label>
              <p className="text-sm text-muted-foreground">
                Use speech-to-text for answers and text-to-speech for questions
              </p>
            </div>
            <Switch
              id="mockInterviewVoiceEnabled"
              defaultChecked={settings?.mockInterviewVoiceEnabled ?? true}
              onCheckedChange={(checked) => saveField("mockInterviewVoiceEnabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Chat Assistant */}
      <Card>
        <CardHeader>
          <CardTitle>Chat Assistant</CardTitle>
          <CardDescription>
            Configure how the chat assistant responds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Response Style</Label>
              {saving === "chatResponseStyle" && <Check className="h-4 w-4 text-success" />}
            </div>
            <RadioGroup
              defaultValue={settings?.chatResponseStyle || "balanced"}
              onValueChange={(value) => saveField("chatResponseStyle", value)}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="concise" id="concise-chat" className="peer sr-only" />
                <Label
                  htmlFor="concise-chat"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Concise</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Brief answers
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="balanced" id="balanced-chat" className="peer sr-only" />
                <Label
                  htmlFor="balanced-chat"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Balanced</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Moderate detail
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="detailed" id="detailed-chat" className="peer sr-only" />
                <Label
                  htmlFor="detailed-chat"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="font-medium">Detailed</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Thorough responses
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="chatIncludeSources">Include Data Sources</Label>
              <p className="text-sm text-muted-foreground">
                Show which data the assistant is referencing
              </p>
            </div>
            <Switch
              id="chatIncludeSources"
              defaultChecked={settings?.chatIncludeSources ?? true}
              onCheckedChange={(checked) => saveField("chatIncludeSources", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
