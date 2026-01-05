import { z } from "zod"

// Profile settings
export const profileSchema = z.object({
  fullName: z.string().max(100).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().max(30).nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional().or(z.literal("")),
  portfolioUrl: z.string().url().nullable().optional().or(z.literal("")),
})

// AI Preferences - Resume Analysis
export const analysisPreferencesSchema = z.object({
  analysisDepth: z.enum(["quick", "standard", "comprehensive"]).optional(),
  analysisFocusAreasJson: z.string().optional(), // JSON array
  interviewQuestionCount: z.number().int().min(5).max(25).optional(),
})

// AI Preferences - Cover Letter
export const coverLetterPreferencesSchema = z.object({
  coverLetterTone: z.enum(["formal", "conversational", "enthusiastic"]).optional(),
  coverLetterLength: z.enum(["short", "medium", "long"]).optional(),
  coverLetterUseAnalysis: z.boolean().optional(),
})

// AI Preferences - Company Research
export const researchPreferencesSchema = z.object({
  researchDepth: z.enum(["basic", "standard", "comprehensive"]).optional(),
  researchSectionsJson: z.string().optional(), // JSON array
})

// AI Preferences - Mock Interview
export const mockInterviewPreferencesSchema = z.object({
  mockInterviewQuestionCount: z.number().int().min(5).max(20).optional(),
  mockInterviewDifficulty: z.enum(["entry", "mid", "senior", "executive"]).optional(),
  mockInterviewFeedbackMode: z.enum(["immediate", "summary"]).optional(),
  mockInterviewVoiceEnabled: z.boolean().optional(),
})

// AI Preferences - Chat
export const chatPreferencesSchema = z.object({
  chatResponseStyle: z.enum(["concise", "balanced", "detailed"]).optional(),
  chatIncludeSources: z.boolean().optional(),
})

// Appearance settings
export const appearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  accentColor: z.enum(["coral", "blue", "green", "purple"]).optional(),
  uiDensity: z.enum(["compact", "comfortable"]).optional(),
  enableAnimations: z.boolean().optional(),
  fontSize: z.enum(["small", "medium", "large"]).optional(),
})

// Integrations settings
export const integrationsSchema = z.object({
  braveSearchApiKey: z.string().nullable().optional(),
})

// Notifications settings
export const notificationsSchema = z.object({
  enableFollowUpReminders: z.boolean().optional(),
  followUpReminderDays: z.number().int().min(1).max(14).optional(),
  enableInterviewReminders: z.boolean().optional(),
  interviewReminderHours: z.number().int().min(1).max(72).optional(),
})

// Combined update schema for PATCH requests
export const updateSettingsSchema = z.object({
  // Profile
  ...profileSchema.shape,
  // AI Preferences - Analysis
  ...analysisPreferencesSchema.shape,
  // AI Preferences - Cover Letter
  ...coverLetterPreferencesSchema.shape,
  // AI Preferences - Research
  ...researchPreferencesSchema.shape,
  // AI Preferences - Mock Interview
  ...mockInterviewPreferencesSchema.shape,
  // AI Preferences - Chat
  ...chatPreferencesSchema.shape,
  // Appearance
  ...appearanceSchema.shape,
  // Integrations
  ...integrationsSchema.shape,
  // Notifications
  ...notificationsSchema.shape,
  // Master Resume
  masterResumeId: z.number().int().positive().nullable().optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>

// Settings response type
export interface UserSettingsResponse {
  id: number
  // Profile
  fullName: string | null
  email: string | null
  phone: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  masterResumeId: number | null
  // AI Preferences
  analysisDepth: "quick" | "standard" | "comprehensive"
  analysisFocusAreasJson: string | null
  interviewQuestionCount: number
  coverLetterTone: "formal" | "conversational" | "enthusiastic"
  coverLetterLength: "short" | "medium" | "long"
  coverLetterUseAnalysis: boolean
  researchDepth: "basic" | "standard" | "comprehensive"
  researchSectionsJson: string | null
  mockInterviewQuestionCount: number
  mockInterviewDifficulty: "entry" | "mid" | "senior" | "executive"
  mockInterviewFeedbackMode: "immediate" | "summary"
  mockInterviewVoiceEnabled: boolean
  chatResponseStyle: "concise" | "balanced" | "detailed"
  chatIncludeSources: boolean
  // Appearance
  theme: "light" | "dark" | "system"
  accentColor: string
  uiDensity: "compact" | "comfortable"
  enableAnimations: boolean
  fontSize: "small" | "medium" | "large"
  // Integrations
  braveSearchApiKey: string | null
  // Notifications
  enableFollowUpReminders: boolean
  followUpReminderDays: number
  enableInterviewReminders: boolean
  interviewReminderHours: number
  // Timestamps
  createdAt: Date
  updatedAt: Date
  // Relations
  masterResume?: {
    id: number
    filename: string | null
    createdAt: Date
  } | null
}

// Storage stats type
export interface StorageStats {
  jobCount: number
  resumeCount: number
  coverLetterCount: number
  chatSessionCount: number
  mockInterviewCount: number
}
