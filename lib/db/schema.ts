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
