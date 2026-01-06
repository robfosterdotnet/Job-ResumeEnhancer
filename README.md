# Job Resume Enhancer

A comprehensive job search assistant that analyzes resumes, researches companies, optimizes LinkedIn profiles, and prepares you for interviews. Built with Next.js, Azure OpenAI, and Anthropic-inspired design.

[![CI](https://github.com/robfosterdotnet/Job-ResumeEnhancer/actions/workflows/ci.yml/badge.svg)](https://github.com/robfosterdotnet/Job-ResumeEnhancer/actions/workflows/ci.yml)
![Version](https://img.shields.io/badge/version-1.3-blue)
![Tests](https://img.shields.io/badge/tests-146%20passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)

---

## Screenshots

### Dashboard with Kanban Pipeline
![Dashboard](docs/screenshots/01-empty-dashboard.png)

### Resume Analysis with Fit Score
![Resume Analysis](docs/screenshots/05-resume-analysis.png)

### Company Research
![Company Research](docs/screenshots/06-company-research.png)

### Mock Interview Practice
![Mock Interview](docs/screenshots/09-mock-interview-question.png)

### AI-Powered Feedback
![Interview Feedback](docs/screenshots/10-mock-interview-feedback.png)

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/robfosterdotnet/Job-ResumeEnhancer.git
cd Job-ResumeEnhancer
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Azure OpenAI credentials

# Initialize database and start
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to get started.

---

## Features

| Feature | Description |
|---------|-------------|
| **Interactive Dashboard** | Kanban pipeline, metrics bar, activity timeline, skill gap tracking |
| **Resume Analysis** | Fit scoring, enhancement suggestions, keyword analysis, interview questions |
| **Company Research** | Leadership profiles, financials, news, legal issues, ethics alignment |
| **LinkedIn Optimization** | Profile scoring, headline alternatives, summary rewrite, SEO keywords |
| **Interviewer Research** | Parse profiles, predict questions, find common ground |
| **Mock Interviews** | AI feedback, STAR method analysis, voice input/output, session summaries |
| **Cover Letters** | Tone/length options, multiple versions, inline editing |
| **Chat Assistant** | Conversational follow-up with your saved data |
| **Settings** | Theme customization, AI preferences, data export/import |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16+ (App Router) + TypeScript |
| AI | Azure OpenAI (gpt-5.2 deployment) |
| Database | SQLite + Drizzle ORM (20 tables) |
| Web Search | Brave Search API + DuckDuckGo fallback |
| UI | Tailwind CSS v4 + shadcn/ui |
| Testing | Vitest + React Testing Library (146 tests) |
| CI/CD | GitHub Actions |

**Codebase:** 256 TypeScript files, 88 React components, 34 API routes, 7 AI agents

---

## Environment Variables

Create a `.env` file:

```bash
# Required - Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-5.2
AZURE_OPENAI_API_VERSION=2024-07-01-preview

# Required - Database
DATABASE_URL=file:./data/resume-enhancer.db

# Required for production - Authentication
AUTH_SECRET_TOKEN=your-secure-random-token-min-32-chars

# Optional - Web Search (falls back to DuckDuckGo)
BRAVE_SEARCH_API_KEY=your-brave-api-key
```

---

## Application Walkthrough

### 1. Create a Job Application

Click "New Job Application" from the sidebar. Enter the job title, company name, and paste the job description (or enter a URL to auto-scrape with AI cleanup).

![New Job Form](docs/screenshots/02-new-job-form.png)

### 2. Upload Your Resume

Upload your resume (PDF, DOCX, or TXT) via drag-and-drop or click to browse.

![Job Detail with Resume](docs/screenshots/04-resume-uploaded.png)

### 3. Analyze Your Resume

Click "Analyze Resume" to get AI-powered insights including:
- **Fit Score** (0-100%) with detailed breakdown
- **Strengths** and areas for improvement
- **Enhancement Suggestions** with before/after text
- **Keyword Analysis** (matched and missing)
- **Interview Questions** with suggested answers

### 4. Research the Company

Click "Research Company" to gather intelligence:
- Company overview and industry positioning
- Leadership team profiles
- Financial information and growth trends
- Employee reviews and culture insights
- Recent news with sentiment analysis
- Legal issues and regulatory concerns
- Ethics alignment scoring

### 5. Additional Features

| Action | What You Get |
|--------|--------------|
| **LinkedIn Align** | Profile score, headline alternatives, optimized summary, SEO keywords |
| **Interviewers** | Research panel members, predict their questions, find talking points |
| **Mock Interview** | Practice with AI feedback, STAR analysis, voice support |
| **Cover Letter** | Generate tailored letters with tone/length options |
| **Chat** | Ask follow-up questions about your analysis |
| **Export** | Download reports as JSON or Markdown |

### Mock Interview Flow

![Mock Interview Setup](docs/screenshots/08-mock-interview-setup.png)

Configure sessions with:
- Feedback mode (immediate or summary)
- Question count (5-20)
- Difficulty level
- Focus categories
- Specific interviewers to simulate

![Mock Interview Summary](docs/screenshots/11-mock-interview-summary.png)

### Cover Letter Generation

![Cover Letter](docs/screenshots/cover-letter-feature.png)

---

## Development

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run all tests
npm run test:watch   # Watch mode
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
```

---

## Project Structure

```
Job-ResumeEnhancer/
├── app/
│   ├── (dashboard)/              # Dashboard pages
│   │   ├── page.tsx              # Main dashboard with Kanban
│   │   ├── jobs/[jobId]/         # Job detail & sub-pages
│   │   ├── linkedin/             # Standalone LinkedIn optimization
│   │   └── settings/             # Application settings
│   └── api/
│       ├── agents/               # 7 AI agent endpoints (streaming)
│       ├── jobs/                 # Job CRUD
│       ├── dashboard/            # Dashboard data
│       └── ...                   # Other endpoints
├── components/
│   ├── ui/                       # Base UI components (30+)
│   ├── analysis/                 # Resume analysis views
│   ├── research/                 # Company research views
│   ├── dashboard/                # Dashboard components
│   └── ...                       # Feature-specific components
├── lib/
│   ├── db/                       # Drizzle schema & connection
│   ├── ai/                       # Azure OpenAI client & agents
│   ├── parsers/                  # PDF, DOCX, LinkedIn parsing
│   └── utils/                    # Shared utilities
└── __tests__/                    # 146 tests across 16 files
```

---

## API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/jobs` | List/create job applications |
| GET/PUT/DELETE | `/api/jobs/[jobId]` | Job CRUD operations |
| POST | `/api/jobs/[jobId]/resume` | Upload resume |

### AI Agents (Streaming SSE)

| Endpoint | Description |
|----------|-------------|
| `/api/agents/resume-analyzer` | Resume analysis |
| `/api/agents/company-research` | Company research |
| `/api/agents/mock-interviewer` | Mock interview |
| `/api/agents/cover-letter` | Cover letter generation |
| `/api/agents/linkedin-optimizer` | LinkedIn optimization |
| `/api/interviewers` | Interviewer analysis |

### Other

| Endpoint | Description |
|----------|-------------|
| `/api/chat` | Chat with saved data |
| `/api/scrape` | Scrape job description URL |
| `/api/export` | Generate reports |
| `/api/settings` | User settings |
| `/api/dashboard/*` | Dashboard data |

---

## Deployment

### Supported Platforms

- **Vercel** (with Node.js runtime) - Recommended for simplicity
- **Docker** - For consistent cross-platform deployments
- **VPS** (DigitalOcean, Linode, AWS EC2) - Full control

**Requirements:** Node.js runtime, filesystem access (SQLite uses `better-sqlite3`)

### Vercel (Quickest)

1. Import repo at [vercel.com/new](https://vercel.com/new)
2. Add environment variables in Settings
3. Deploy

**Note:** Vercel's serverless has ephemeral filesystems. Database resets on cold starts. For persistence, use Turso or PostgreSQL.

### Docker

```dockerfile
# See full Dockerfile in repo
docker-compose up -d --build
```

### VPS

```bash
# Install Node.js 20, build tools, PM2
npm ci && npm run build
pm2 start ecosystem.config.js
```

See detailed deployment instructions for each platform in the full documentation.

### Authentication

All API routes require bearer token authentication in production:

```bash
curl -H "Authorization: Bearer your-auth-secret-token" \
  https://your-domain.com/api/jobs
```

---

## CI/CD

**GitHub Actions** (`.github/workflows/ci.yml`):
- Runs on PRs and pushes to main
- Executes: `npm ci` → `lint` → `test` → `build`

**Vercel Deploy** (optional):
- Manual trigger via Actions tab
- Requires: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

---

## Documentation

| File | Description |
|------|-------------|
| `SPECIFICATION.md` | Complete technical specification |
| `CLAUDE.md` | AI assistant guidance for this codebase |
| `AGENTS.md` | Documentation of all 7 AI agents |

---

## Design

Uses Anthropic brand colors:
- **Primary**: #E5674C (Coral)
- **Background**: #FAFAFA
- **Foreground**: #1A1A2E

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| v1.0 | Jan 3, 2026 | Core features: Resume analysis, company research, chat, export |
| v1.1 | Jan 3, 2026 | Mock interview practice with AI feedback, voice support |
| v1.2 | Jan 4, 2026 | Security hardening, all code review issues resolved |
| v1.3 | Jan 5, 2026 | Cover letters, LinkedIn optimization, interviewer research, dashboard, settings |

---

## License

MIT
