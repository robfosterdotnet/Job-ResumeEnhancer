import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"

// ============ CORE TABLES ============

export const resumes = sqliteTable("resumes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename"),
  originalContent: text("original_content").notNull(),
  parsedContent: text("parsed_content").notNull(),
  filePath: text("file_path"),
  fileType: text("file_type").$type<"pdf" | "docx" | "txt" | "pasted">(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  website: text("website"),
  industry: text("industry"),
  description: text("description"),
  headquarters: text("headquarters"),
  employeeCount: text("employee_count"),
  foundedYear: integer("founded_year"),
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  stockSymbol: text("stock_symbol"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

export const jobApplications = sqliteTable("job_applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  resumeId: integer("resume_id").references(() => resumes.id),
  jobDescriptionUrl: text("job_description_url"),
  jobDescriptionText: text("job_description_text").notNull(),
  jobDescriptionParsed: text("job_description_parsed"),
  status: text("status").$type<
    "saved" | "analyzing" | "analyzed" | "applied" | "interviewing" |
    "offered" | "accepted" | "rejected" | "withdrawn"
  >().default("saved"),
  notes: text("notes"),
  appliedAt: integer("applied_at", { mode: "timestamp" }),
  interviewDate: integer("interview_date", { mode: "timestamp" }),
  followUpDate: integer("follow_up_date", { mode: "timestamp" }),
  pipelineOrder: integer("pipeline_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

// ============ ANALYSIS TABLES ============

export const resumeAnalyses = sqliteTable("resume_analyses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobApplicationId: integer("job_application_id")
    .references(() => jobApplications.id)
    .notNull(),
  fitScore: real("fit_score"),
  overallSummary: text("overall_summary"),
  strengthsJson: text("strengths_json"),
  weaknessesJson: text("weaknesses_json"),
  enhancementSuggestionsJson: text("enhancement_suggestions_json"),
  skillGapsJson: text("skill_gaps_json"),
  interviewQuestionsJson: text("interview_questions_json"),
  keywordsMatchedJson: text("keywords_matched_json"),
  keywordsMissingJson: text("keywords_missing_json"),
  rawResponseJson: text("raw_response_json"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

export const interviewQuestions = sqliteTable("interview_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  resumeAnalysisId: integer("resume_analysis_id")
    .references(() => resumeAnalyses.id)
    .notNull(),
  question: text("question").notNull(),
  category: text("category").$type<
    "behavioral" | "technical" | "situational" | "company-specific" | "role-specific"
  >(),
  suggestedAnswer: text("suggested_answer"),
  difficulty: text("difficulty").$type<"easy" | "medium" | "hard">(),
  orderIndex: integer("order_index"),
})

// ============ COMPANY RESEARCH TABLES ============

export const companyResearch = sqliteTable("company_research", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .references(() => companies.id)
    .notNull(),
  jobApplicationId: integer("job_application_id")
    .references(() => jobApplications.id),
  researchSummary: text("research_summary"),
  coreBusinessJson: text("core_business_json"),
  cultureValuesJson: text("culture_values_json"),
  ethicsAlignmentJson: text("ethics_alignment_json"),
  rawResponseJson: text("raw_response_json"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

export const leadershipTeam = sqliteTable("leadership_team", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyResearchId: integer("company_research_id")
    .references(() => companyResearch.id)
    .notNull(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  role: text("role").$type<"ceo" | "cfo" | "cto" | "coo" | "board" | "vp" | "other">(),
  bio: text("bio"),
  linkedinUrl: text("linkedin_url"),
  imageUrl: text("image_url"),
})

export const financialInfo = sqliteTable("financial_info", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyResearchId: integer("company_research_id")
    .references(() => companyResearch.id)
    .notNull(),
  fiscalYear: integer("fiscal_year"),
  revenue: real("revenue"),
  revenueGrowth: real("revenue_growth"),
  netIncome: real("net_income"),
  marketCap: real("market_cap"),
  stockPrice: real("stock_price"),
  peRatio: real("pe_ratio"),
  dataSourceUrl: text("data_source_url"),
  retrievedAt: integer("retrieved_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

export const companyNews = sqliteTable("company_news", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyResearchId: integer("company_research_id")
    .references(() => companyResearch.id)
    .notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  sentiment: text("sentiment").$type<"positive" | "neutral" | "negative">(),
  relevance: text("relevance").$type<"high" | "medium" | "low">(),
})

export const legalIssues = sqliteTable("legal_issues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyResearchId: integer("company_research_id")
    .references(() => companyResearch.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  caseType: text("case_type"),
  status: text("status").$type<"ongoing" | "settled" | "dismissed" | "pending">(),
  filingDate: integer("filing_date", { mode: "timestamp" }),
  sourceUrl: text("source_url"),
})

export const glassdoorInsights = sqliteTable("glassdoor_insights", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyResearchId: integer("company_research_id")
    .references(() => companyResearch.id)
    .notNull(),
  overallRating: real("overall_rating"),
  ceoApproval: real("ceo_approval"),
  recommendToFriend: real("recommend_to_friend"),
  cultureRating: real("culture_rating"),
  workLifeBalance: real("work_life_balance"),
  compensationRating: real("compensation_rating"),
  careerOpportunities: real("career_opportunities"),
  prosJson: text("pros_json"),
  consJson: text("cons_json"),
  retrievedAt: integer("retrieved_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

// ============ CHAT TABLES ============

export const chatSessions = sqliteTable("chat_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobApplicationId: integer("job_application_id")
    .references(() => jobApplications.id),
  title: text("title"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .references(() => chatSessions.id)
    .notNull(),
  role: text("role").$type<"user" | "assistant" | "system">().notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

// ============ MOCK INTERVIEW TABLES ============

export const mockInterviewSessions = sqliteTable("mock_interview_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobApplicationId: integer("job_application_id")
    .references(() => jobApplications.id)
    .notNull(),
  resumeAnalysisId: integer("resume_analysis_id")
    .references(() => resumeAnalyses.id),

  // Session Configuration
  feedbackMode: text("feedback_mode").$type<"immediate" | "summary">().notNull().default("immediate"),
  questionCount: integer("question_count").default(10),
  selectedCategoriesJson: text("selected_categories_json"), // JSON array of categories
  difficulty: text("difficulty").$type<"mixed" | "easy" | "medium" | "hard">().default("mixed"),
  voiceEnabled: integer("voice_enabled", { mode: "boolean" }).default(false),

  // Session State
  status: text("status").$type<"setup" | "in_progress" | "completed" | "abandoned">().default("setup"),
  currentQuestionIndex: integer("current_question_index").default(0),

  // Performance Summary (populated on completion)
  overallScore: real("overall_score"),
  summaryFeedback: text("summary_feedback"),
  strengthAreasJson: text("strength_areas_json"),
  improvementAreasJson: text("improvement_areas_json"),

  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

export const mockInterviewResponses = sqliteTable("mock_interview_responses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .references(() => mockInterviewSessions.id)
    .notNull(),

  // Question Info
  questionId: integer("question_id")
    .references(() => interviewQuestions.id), // null if AI-generated follow-up
  questionText: text("question_text").notNull(),
  questionCategory: text("question_category").$type<
    "behavioral" | "technical" | "situational" | "company-specific" | "role-specific" | "follow-up"
  >(),
  questionDifficulty: text("question_difficulty").$type<"easy" | "medium" | "hard">(),
  isFollowUp: integer("is_follow_up", { mode: "boolean" }).default(false),
  parentResponseId: integer("parent_response_id"), // Self-reference for follow-ups
  orderIndex: integer("order_index").notNull(),

  // User Response
  userAnswer: text("user_answer"),
  answeredAt: integer("answered_at", { mode: "timestamp" }),
  answerDurationSeconds: integer("answer_duration_seconds"),

  // AI Evaluation
  score: real("score"), // 0-100
  feedback: text("feedback"),
  suggestedImprovement: text("suggested_improvement"),
  keyPointsCoveredJson: text("key_points_covered_json"),
  keyPointsMissedJson: text("key_points_missed_json"),
  evaluatedAt: integer("evaluated_at", { mode: "timestamp" }),

  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

export const mockInterviewMetrics = sqliteTable("mock_interview_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobApplicationId: integer("job_application_id")
    .references(() => jobApplications.id)
    .notNull()
    .unique(),

  // Aggregated Performance Metrics
  totalSessions: integer("total_sessions").default(0),
  completedSessions: integer("completed_sessions").default(0),
  averageScore: real("average_score"),

  // Category Performance
  behavioralAvgScore: real("behavioral_avg_score"),
  technicalAvgScore: real("technical_avg_score"),
  situationalAvgScore: real("situational_avg_score"),
  companySpecificAvgScore: real("company_specific_avg_score"),
  roleSpecificAvgScore: real("role_specific_avg_score"),

  // Trend Data
  scoreHistoryJson: text("score_history_json"), // JSON array of {date, score}

  // Best/Worst Areas
  strongestCategory: text("strongest_category"),
  weakestCategory: text("weakest_category"),

  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

// ============ COVER LETTER TABLE ============

export const coverLetters = sqliteTable("cover_letters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobApplicationId: integer("job_application_id")
    .references(() => jobApplications.id)
    .notNull(),

  // Generation parameters
  tone: text("tone").$type<"formal" | "conversational" | "enthusiastic">().notNull(),
  length: text("length").$type<"short" | "medium" | "long">().notNull(),
  useAnalysisInsights: integer("use_analysis_insights", { mode: "boolean" }).default(true),

  // Content structure
  greeting: text("greeting").notNull(),
  openingParagraph: text("opening_paragraph").notNull(),
  bodyParagraphs: text("body_paragraphs").notNull(), // JSON array
  closingParagraph: text("closing_paragraph").notNull(),
  signOff: text("sign_off").notNull(),

  // Full compiled letter
  fullContent: text("full_content").notNull(),

  // Edit tracking
  isEdited: integer("is_edited", { mode: "boolean" }).default(false),
  editedContent: text("edited_content"),

  // Metadata
  versionNumber: integer("version_number").notNull().default(1),
  rawResponseJson: text("raw_response_json"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

// ============ LINKEDIN PROFILE TABLES ============

export const linkedInProfiles = sqliteTable("linkedin_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Profile Data
  profileUrl: text("profile_url"),
  fullName: text("full_name"),
  headline: text("headline"),
  summary: text("summary"),
  location: text("location"),

  // Parsed Sections (stored as JSON)
  experienceJson: text("experience_json"), // Array of positions
  educationJson: text("education_json"), // Array of education entries
  skillsJson: text("skills_json"), // Array of skills
  certificationsJson: text("certifications_json"),

  // Raw Content (for re-analysis)
  rawContent: text("raw_content"),

  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

export const linkedInAnalyses = sqliteTable("linkedin_analyses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  linkedInProfileId: integer("linkedin_profile_id")
    .references(() => linkedInProfiles.id)
    .notNull(),
  jobApplicationId: integer("job_application_id")
    .references(() => jobApplications.id),

  // Target Role Info
  targetRole: text("target_role"),
  targetIndustry: text("target_industry"),

  // Scores
  overallScore: real("overall_score"), // 0-100
  headlineScore: real("headline_score"),
  summaryScore: real("summary_score"),
  experienceScore: real("experience_score"),
  skillsScore: real("skills_score"),
  completenessScore: real("completeness_score"),
  keywordScore: real("keyword_score"),

  // Analysis Results
  overallSummary: text("overall_summary"),
  headlineAnalysisJson: text("headline_analysis_json"),
  summaryAnalysisJson: text("summary_analysis_json"),
  experienceAnalysisJson: text("experience_analysis_json"),
  skillsAnalysisJson: text("skills_analysis_json"),

  // Suggestions
  suggestedHeadlinesJson: text("suggested_headlines_json"), // Array of 3 headline options
  suggestedSummary: text("suggested_summary"),
  suggestedSkillsJson: text("suggested_skills_json"),
  keywordsToAddJson: text("keywords_to_add_json"),

  // Completeness Checklist
  completenessChecklistJson: text("completeness_checklist_json"),

  // Raw Response
  rawResponseJson: text("raw_response_json"),

  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

// ============ USER SETTINGS TABLE ============

export const userSettings = sqliteTable("user_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Profile
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),

  // Master Resume
  masterResumeId: integer("master_resume_id").references(() => resumes.id),

  // AI Preferences - Resume Analysis
  analysisDepth: text("analysis_depth").$type<"quick" | "standard" | "comprehensive">().default("standard"),
  analysisFocusAreasJson: text("analysis_focus_areas_json").default('["keywords","skills"]'),
  interviewQuestionCount: integer("interview_question_count").default(15),

  // AI Preferences - Cover Letter
  coverLetterTone: text("cover_letter_tone").$type<"formal" | "conversational" | "enthusiastic">().default("conversational"),
  coverLetterLength: text("cover_letter_length").$type<"short" | "medium" | "long">().default("medium"),
  coverLetterUseAnalysis: integer("cover_letter_use_analysis", { mode: "boolean" }).default(true),

  // AI Preferences - Company Research
  researchDepth: text("research_depth").$type<"basic" | "standard" | "comprehensive">().default("standard"),
  researchSectionsJson: text("research_sections_json").default('["leadership","financials","news","legal","ethics"]'),

  // AI Preferences - Mock Interview
  mockInterviewQuestionCount: integer("mock_interview_question_count").default(10),
  mockInterviewDifficulty: text("mock_interview_difficulty").$type<"entry" | "mid" | "senior" | "executive">().default("mid"),
  mockInterviewFeedbackMode: text("mock_interview_feedback_mode").$type<"immediate" | "summary">().default("immediate"),
  mockInterviewVoiceEnabled: integer("mock_interview_voice_enabled", { mode: "boolean" }).default(true),

  // AI Preferences - Chat
  chatResponseStyle: text("chat_response_style").$type<"concise" | "balanced" | "detailed">().default("balanced"),
  chatIncludeSources: integer("chat_include_sources", { mode: "boolean" }).default(true),

  // Appearance
  theme: text("theme").$type<"light" | "dark" | "system">().default("system"),
  accentColor: text("accent_color").default("coral"),
  uiDensity: text("ui_density").$type<"compact" | "comfortable">().default("comfortable"),
  enableAnimations: integer("enable_animations", { mode: "boolean" }).default(true),
  fontSize: text("font_size").$type<"small" | "medium" | "large">().default("medium"),

  // Integrations
  braveSearchApiKey: text("brave_search_api_key"),

  // Notifications (future)
  enableFollowUpReminders: integer("enable_follow_up_reminders", { mode: "boolean" }).default(true),
  followUpReminderDays: integer("follow_up_reminder_days").default(7),
  enableInterviewReminders: integer("enable_interview_reminders", { mode: "boolean" }).default(true),
  interviewReminderHours: integer("interview_reminder_hours").default(24),

  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

export const masterResumeVersions = sqliteTable("master_resume_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  resumeId: integer("resume_id")
    .references(() => resumes.id)
    .notNull(),
  versionNumber: integer("version_number").notNull(),
  changeNote: text("change_note"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

// ============ INTERVIEWER PROFILES TABLE ============

export const interviewerProfiles = sqliteTable("interviewer_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobApplicationId: integer("job_application_id")
    .references(() => jobApplications.id)
    .notNull(),

  // Basic Info (user input)
  name: text("name").notNull(),
  role: text("role"), // Their role: "Engineering Manager", "Senior Developer"
  interviewRole: text("interview_role").$type<
    "hiring_manager" | "technical" | "hr" | "peer" | "executive" | "other"
  >(), // Their role in the interview
  linkedInUrl: text("linkedin_url"),

  // Parsed from LinkedIn (reuse linkedin-parser.ts)
  headline: text("headline"),
  summary: text("summary"),
  location: text("location"),
  experienceJson: text("experience_json"), // Array of positions
  educationJson: text("education_json"), // Array of education
  skillsJson: text("skills_json"), // Array of skills
  rawLinkedInContent: text("raw_linkedin_content"),

  // AI-Generated Interview Insights
  expertiseAreasJson: text("expertise_areas_json"), // What they specialize in
  likelyInterviewFocus: text("likely_interview_focus").$type<
    "technical" | "behavioral" | "culture" | "mixed"
  >(),
  questionsTheyMayAskJson: text("questions_they_may_ask_json"),
  suggestedQuestionsToAskJson: text("suggested_questions_to_ask_json"),
  talkingPointsJson: text("talking_points_json"), // Common ground, conversation starters
  interviewTipsJson: text("interview_tips_json"), // How to approach this interviewer

  // Status
  analysisStatus: text("analysis_status")
    .$type<"pending" | "analyzing" | "completed" | "failed">()
    .default("pending"),
  rawResponseJson: text("raw_response_json"),

  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

// ============ DASHBOARD TABLES ============

export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobApplicationId: integer("job_application_id")
    .references(() => jobApplications.id),
  activityType: text("activity_type").$type<
    "job_created" | "resume_uploaded" | "analysis_completed" |
    "research_completed" | "status_changed" | "cover_letter_generated" |
    "interview_scheduled" | "interview_completed"
  >().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  metadata: text("metadata"), // JSON for extra context
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

export const aggregatedSkillGaps = sqliteTable("aggregated_skill_gaps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skill: text("skill").notNull().unique(),
  occurrenceCount: integer("occurrence_count").default(1),
  jobIdsJson: text("job_ids_json"), // JSON array of job IDs that mention this skill
  isLearned: integer("is_learned", { mode: "boolean" }).default(false),
  learnedAt: integer("learned_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

// ============ RELATIONS ============

export const resumesRelations = relations(resumes, ({ many }) => ({
  jobApplications: many(jobApplications),
}))

export const companiesRelations = relations(companies, ({ many }) => ({
  jobApplications: many(jobApplications),
  research: many(companyResearch),
}))

export const jobApplicationsRelations = relations(jobApplications, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobApplications.companyId],
    references: [companies.id],
  }),
  resume: one(resumes, {
    fields: [jobApplications.resumeId],
    references: [resumes.id],
  }),
  analyses: many(resumeAnalyses),
  chatSessions: many(chatSessions),
  mockInterviewSessions: many(mockInterviewSessions),
  mockInterviewMetrics: one(mockInterviewMetrics),
  coverLetters: many(coverLetters),
  activityLogs: many(activityLogs),
  linkedInAnalyses: many(linkedInAnalyses),
  interviewerProfiles: many(interviewerProfiles),
}))

export const resumeAnalysesRelations = relations(resumeAnalyses, ({ one, many }) => ({
  jobApplication: one(jobApplications, {
    fields: [resumeAnalyses.jobApplicationId],
    references: [jobApplications.id],
  }),
  interviewQuestions: many(interviewQuestions),
}))

export const interviewQuestionsRelations = relations(interviewQuestions, ({ one }) => ({
  resumeAnalysis: one(resumeAnalyses, {
    fields: [interviewQuestions.resumeAnalysisId],
    references: [resumeAnalyses.id],
  }),
}))

export const companyResearchRelations = relations(companyResearch, ({ one, many }) => ({
  company: one(companies, {
    fields: [companyResearch.companyId],
    references: [companies.id],
  }),
  jobApplication: one(jobApplications, {
    fields: [companyResearch.jobApplicationId],
    references: [jobApplications.id],
  }),
  leadershipTeam: many(leadershipTeam),
  financialInfo: many(financialInfo),
  news: many(companyNews),
  legalIssues: many(legalIssues),
  glassdoorInsights: many(glassdoorInsights),
}))

export const leadershipTeamRelations = relations(leadershipTeam, ({ one }) => ({
  companyResearch: one(companyResearch, {
    fields: [leadershipTeam.companyResearchId],
    references: [companyResearch.id],
  }),
}))

export const financialInfoRelations = relations(financialInfo, ({ one }) => ({
  companyResearch: one(companyResearch, {
    fields: [financialInfo.companyResearchId],
    references: [companyResearch.id],
  }),
}))

export const companyNewsRelations = relations(companyNews, ({ one }) => ({
  companyResearch: one(companyResearch, {
    fields: [companyNews.companyResearchId],
    references: [companyResearch.id],
  }),
}))

export const legalIssuesRelations = relations(legalIssues, ({ one }) => ({
  companyResearch: one(companyResearch, {
    fields: [legalIssues.companyResearchId],
    references: [companyResearch.id],
  }),
}))

export const glassdoorInsightsRelations = relations(glassdoorInsights, ({ one }) => ({
  companyResearch: one(companyResearch, {
    fields: [glassdoorInsights.companyResearchId],
    references: [companyResearch.id],
  }),
}))

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  jobApplication: one(jobApplications, {
    fields: [chatSessions.jobApplicationId],
    references: [jobApplications.id],
  }),
  messages: many(chatMessages),
}))

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}))

// Mock Interview Relations
export const mockInterviewSessionsRelations = relations(mockInterviewSessions, ({ one, many }) => ({
  jobApplication: one(jobApplications, {
    fields: [mockInterviewSessions.jobApplicationId],
    references: [jobApplications.id],
  }),
  resumeAnalysis: one(resumeAnalyses, {
    fields: [mockInterviewSessions.resumeAnalysisId],
    references: [resumeAnalyses.id],
  }),
  responses: many(mockInterviewResponses),
}))

export const mockInterviewResponsesRelations = relations(mockInterviewResponses, ({ one, many }) => ({
  session: one(mockInterviewSessions, {
    fields: [mockInterviewResponses.sessionId],
    references: [mockInterviewSessions.id],
  }),
  question: one(interviewQuestions, {
    fields: [mockInterviewResponses.questionId],
    references: [interviewQuestions.id],
  }),
  parentResponse: one(mockInterviewResponses, {
    fields: [mockInterviewResponses.parentResponseId],
    references: [mockInterviewResponses.id],
    relationName: "followUps",
  }),
  followUps: many(mockInterviewResponses, { relationName: "followUps" }),
}))

export const mockInterviewMetricsRelations = relations(mockInterviewMetrics, ({ one }) => ({
  jobApplication: one(jobApplications, {
    fields: [mockInterviewMetrics.jobApplicationId],
    references: [jobApplications.id],
  }),
}))

export const coverLettersRelations = relations(coverLetters, ({ one }) => ({
  jobApplication: one(jobApplications, {
    fields: [coverLetters.jobApplicationId],
    references: [jobApplications.id],
  }),
}))

// LinkedIn Relations
export const linkedInProfilesRelations = relations(linkedInProfiles, ({ many }) => ({
  analyses: many(linkedInAnalyses),
}))

export const linkedInAnalysesRelations = relations(linkedInAnalyses, ({ one }) => ({
  profile: one(linkedInProfiles, {
    fields: [linkedInAnalyses.linkedInProfileId],
    references: [linkedInProfiles.id],
  }),
  jobApplication: one(jobApplications, {
    fields: [linkedInAnalyses.jobApplicationId],
    references: [jobApplications.id],
  }),
}))

// Dashboard Relations
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  jobApplication: one(jobApplications, {
    fields: [activityLogs.jobApplicationId],
    references: [jobApplications.id],
  }),
}))

// Interviewer Profiles Relations
export const interviewerProfilesRelations = relations(interviewerProfiles, ({ one }) => ({
  jobApplication: one(jobApplications, {
    fields: [interviewerProfiles.jobApplicationId],
    references: [jobApplications.id],
  }),
}))

// Settings Relations
export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  masterResume: one(resumes, {
    fields: [userSettings.masterResumeId],
    references: [resumes.id],
  }),
}))

export const masterResumeVersionsRelations = relations(masterResumeVersions, ({ one }) => ({
  resume: one(resumes, {
    fields: [masterResumeVersions.resumeId],
    references: [resumes.id],
  }),
}))
