# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Job Resume Enhancer is a personal job search tool that analyzes resumes against job postings and researches companies. It uses two AI agents powered by Azure OpenAI (gpt-5.2):

1. **Resume Analyzer** - Evaluates resumes, provides fit scores, enhancement suggestions, and generates interview questions
2. **Company Researcher** - Deep dives into companies using DuckDuckGo search to find leadership, financials, news, legal issues, and ethics alignment

## Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **AI**: Azure OpenAI (gpt-5.2 deployment)
- **Database**: SQLite with Drizzle ORM
- **Web Search**: DuckDuckGo (duck-duck-scrape)
- **UI**: Tailwind CSS + shadcn/ui with Anthropic brand colors (#E5674C coral primary)

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run db:push      # Push Drizzle schema changes
npm run db:studio    # Open Drizzle Studio
```

## Environment Variables

Required in `.env.local`:
```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-5.2
AZURE_OPENAI_API_VERSION=2024-07-01-preview
DATABASE_URL=file:./data/resume-enhancer.db
```

## Architecture

### Directory Structure

- `app/(dashboard)/` - Dashboard pages using route groups
- `app/api/agents/` - AI agent endpoints (resume-analyzer, company-research) with streaming
- `app/api/jobs/` - CRUD operations for job applications
- `lib/db/` - Drizzle ORM schema and database connection
- `lib/ai/` - Azure OpenAI client and agent implementations
- `lib/parsers/` - PDF, DOCX, TXT document parsing
- `lib/scrapers/` - Web scraping and DuckDuckGo search utilities
- `components/ui/` - shadcn/ui base components
- `components/analysis/` - Resume analysis result views
- `components/research/` - Company research views

### Key Files

- `lib/db/schema.ts` - Drizzle schema with all database tables
- `lib/ai/client.ts` - Azure OpenAI client with streaming support
- `lib/ai/agents/resume-analyzer.ts` - Resume analysis agent logic
- `lib/ai/agents/company-researcher.ts` - Company research agent logic

### Database Tables

Core: `resumes`, `companies`, `jobApplications`
Analysis: `resumeAnalyses`, `interviewQuestions`
Research: `companyResearch`, `leadershipTeam`, `financialInfo`, `companyNews`, `legalIssues`, `glassdoorInsights`
Chat: `chatSessions`, `chatMessages`

### API Patterns

- Agent endpoints use Server-Sent Events (SSE) for streaming responses
- All AI outputs use Zod schemas for structured validation
- Job description URLs are scraped with Cheerio

## Reference

See `SPECIFICATION.md` for the complete technical specification including database schema details, API endpoint documentation, and implementation phases.
