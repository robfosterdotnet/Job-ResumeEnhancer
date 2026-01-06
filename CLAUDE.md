# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JobReady is an AI-powered job search command center that analyzes resumes against job postings, researches companies, optimizes LinkedIn profiles, and prepares candidates for interviews. It uses two AI agents powered by Azure OpenAI (gpt-5.2):

1. **Resume Analyzer** - Evaluates resumes, provides fit scores, enhancement suggestions, and generates interview questions
2. **Company Researcher** - Deep dives into companies using Brave Search (with DuckDuckGo fallback) to find leadership, financials, news, legal issues, and ethics alignment

## Tech Stack

- **Framework**: Next.js 16+ (App Router) with TypeScript
- **AI**: Azure OpenAI (gpt-5.2 deployment) - uses `max_completion_tokens` not `max_tokens`
- **Database**: SQLite with Drizzle ORM
- **Web Search**: Brave Search API (primary) with DuckDuckGo fallback
- **UI**: Tailwind CSS v4 + custom shadcn/ui components with Anthropic brand colors (#E5674C coral primary)
- **Testing**: Vitest with React Testing Library

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run db:push      # Push Drizzle schema changes to SQLite
npm run db:studio    # Open Drizzle Studio for database inspection
```

To run a single test file:
```bash
npx vitest run __tests__/components/analysis/fit-score-gauge.test.tsx
```

## Environment Variables

Required in `.env` or `.env.local`:
```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-5.2
AZURE_OPENAI_API_VERSION=2024-07-01-preview
DATABASE_URL=file:./data/resume-enhancer.db
BRAVE_SEARCH_API_KEY=your-brave-api-key  # Optional, falls back to DuckDuckGo
```

## Architecture

### Route Structure

- `app/(dashboard)/` - Dashboard pages using route groups for shared layout
- `app/(dashboard)/jobs/[jobId]/` - Dynamic job detail pages with sub-routes:
  - `resume-analysis/` - Analysis results view
  - `company-research/` - Research results view
  - `chat/` - Chat interface with session management
- `app/api/agents/` - AI agent endpoints with SSE streaming
- `app/api/jobs/` - CRUD operations for job applications

### Key Patterns

**Streaming AI Responses**: Agent endpoints (`resume-analyzer`, `company-research`, `chat`) use Server-Sent Events for streaming. They return progress updates and final results via `data:` events with types: `chunk`, `complete`, `error`.

**Zod Schema Validation**: All AI outputs are validated against Zod schemas in `lib/ai/agents/`. Schemas use `.nullable().transform(v => v ?? default)` pattern to handle null AI responses gracefully.

**Drizzle Relations**: The database schema (`lib/db/schema.ts`) defines 13 tables with extensive relations. Use `db.query.tableName.findFirst/findMany({ with: { relation: true } })` for eager loading.

**Chat Markdown Rendering**: Chat assistant responses render markdown using `react-markdown` with `remark-gfm` for GitHub Flavored Markdown support.

### Component Organization

- `components/ui/` - Base UI components (button, card, input, dialog, etc.)
- `components/analysis/` - Resume analysis views (FitScoreGauge, StrengthsWeaknesses, SkillGaps, InterviewQuestions)
- `components/research/` - Company research views (CompanyOverview, LeadershipTeam, Financials, NewsFeed, LegalIssues, EthicsAlignment)
- `components/chat/` - Chat interface (ChatMessage, ChatMessageList, ChatInput, ChatInterface)
- `components/jobs/` - Job management (JobForm, ResumeUploader, ExportButton)

### Database Tables

Core: `resumes`, `companies`, `jobApplications`
Analysis: `resumeAnalyses`, `interviewQuestions`
Research: `companyResearch`, `leadershipTeam`, `financialInfo`, `companyNews`, `legalIssues`, `glassdoorInsights`
Chat: `chatSessions`, `chatMessages`

## Important Implementation Notes

- Azure OpenAI only supports `temperature: 1` - do not pass other temperature values
- Brave Search API has 1 query/second rate limit - use 1.5s delays between sequential searches
- The `chatSessions` table relates to `jobApplications` via `jobApplicationId`
- Client components using server-passed props (like `initialMessages`) need `useEffect` to sync on prop changes

## Local Files Directory

The `.local/` directory is for drafts, notes, and working files that should NOT be committed to the repository. This directory is in `.gitignore`.

Use `.local/` for:
- LinkedIn article drafts
- Planning documents
- Personal notes
- Any other files that should stay local

## Reference

See `SPECIFICATION.md` for the complete technical specification including database schema details, API endpoint documentation, and implementation status.
