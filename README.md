# Job Resume Enhancer

A personal job search tool that analyzes your resume against job postings and deeply researches companies before applying. Built with Next.js, Azure OpenAI, and Anthropic-inspired design.

[![CI](https://github.com/robfosterdotnet/Job-ResumeEnhancer/actions/workflows/ci.yml/badge.svg)](https://github.com/robfosterdotnet/Job-ResumeEnhancer/actions/workflows/ci.yml)

## Features

### Resume Analysis
- Upload resume (PDF, DOCX, TXT) or paste text directly
- Enter job description URL (auto-scrapes) or paste text
- Get a 0-100% fit score with detailed breakdown
- View strengths and areas for improvement
- Receive specific enhancement suggestions with before/after text
- Identify skill gaps with actionable recommendations
- Generate 15-20 likely interview questions with suggested answers

### Company Research
- Deep dive into any company using Brave Search API (with DuckDuckGo fallback)
- Leadership team profiles (CEO, executives, board members)
- Financial information (revenue, market cap, growth trends)
- Employee reviews and culture insights (Glassdoor-style)
- Recent news with sentiment analysis
- Legal issues and regulatory concerns
- Ethics alignment scoring

### Chat Assistant
- Conversational interface with your saved research data
- Ask follow-up questions about analysis or company research
- Markdown-rendered responses with bullet points, lists, and formatting
- Session management for multiple conversations per job

### Mock Interview Practice
- Practice answering interview questions generated from your resume analysis
- Choose between immediate feedback or summary-at-end modes
- Select number of questions (5-20), difficulty, and focus categories
- AI-powered evaluation with STAR method analysis
- Detailed scoring (0-100) with strengths and improvement areas
- Dynamic follow-up questions based on your answers
- Session summaries with practice recommendations
- Voice input/output support (Web Speech API)

### Cover Letter Generation
- Generate tailored cover letters based on your resume and job description
- Multiple tone options: formal, conversational, or enthusiastic
- Length options: short, medium, or long
- Optional integration with resume analysis insights
- Save multiple versions for comparison
- Inline editing with revert capability
- Copy to clipboard or download as text
- Included in job exports

### Application Tracking
- Manage multiple job applications in one dashboard
- Track status: Saved → Analyzing → Applied → Interviewing → Offered
- Export reports as JSON or Markdown

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16+ (App Router) + TypeScript |
| AI | Azure OpenAI (gpt-5.2 deployment) |
| Database | SQLite + Drizzle ORM |
| Web Search | Brave Search API (primary) + DuckDuckGo (fallback) |
| UI | Tailwind CSS v4 + shadcn/ui + Anthropic brand colors |
| Testing | Vitest + React Testing Library |

## Getting Started

### Prerequisites

- Node.js 18+
- Azure OpenAI API access with a gpt-5.2 (or compatible) deployment
- Brave Search API key (optional, falls back to DuckDuckGo)

### Installation

```bash
# Clone the repository
git clone https://github.com/robfosterdotnet/Job-ResumeEnhancer.git
cd Job-ResumeEnhancer

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API credentials

# Initialize the database
npm run db:push

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file with the following:

```bash
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-5.2
AZURE_OPENAI_API_VERSION=2024-07-01-preview

# Database
DATABASE_URL=file:./data/resume-enhancer.db

# Web Search (optional - falls back to DuckDuckGo if not set)
BRAVE_SEARCH_API_KEY=your-brave-api-key
```

## Application Walkthrough

### 1. Create a New Job Application

Start by clicking "New Job Application" from the sidebar. Enter the job title, company name, and paste the job description.

![New Job Form](docs/screenshots/02-new-job-form.png)

### 2. Upload Your Resume

After creating the job, you'll see the job detail page. Upload your resume (PDF, DOCX, or TXT) or paste the text directly.

![Job Detail with Resume](docs/screenshots/04-resume-uploaded.png)

### 3. Analyze Your Resume

Click "Analyze Resume" to get AI-powered insights on how well your resume matches the job description.

![Resume Analysis Results](docs/screenshots/05-resume-analysis.png)

The analysis includes:
- **Fit Score** (0-100%) - How well your resume matches the job
- **Strengths** - What you're doing well
- **Areas for Improvement** - Specific suggestions to improve
- **Enhancement Suggestions** - Before/after text improvements
- **Keyword Analysis** - Matched and missing keywords
- **Interview Questions** - Likely questions with suggested answers

### 4. Research the Company

Click "Research Company" to gather detailed information about the company using web search.

![Company Research](docs/screenshots/06-company-research.png)

Company research includes:
- Company overview and industry
- Leadership team profiles
- Financial information
- Employee reviews and culture
- Recent news with sentiment analysis
- Legal issues and regulatory concerns
- Ethics alignment scoring

### 5. Practice with Mock Interviews

Click "Mock Interview" to practice answering interview questions with AI-powered feedback.

![Mock Interview Dashboard](docs/screenshots/07-mock-interview-dashboard.png)

Configure your practice session with feedback mode, number of questions, difficulty, and focus categories.

![Mock Interview Setup](docs/screenshots/08-mock-interview-setup.png)

Answer questions and receive immediate feedback with STAR method analysis.

![Mock Interview Question](docs/screenshots/09-mock-interview-question.png)

The AI evaluates your answers based on:
- Relevance and structure
- STAR method components (Situation, Task, Action, Result)
- Key points covered and missed
- Specific improvement suggestions

![Mock Interview Feedback](docs/screenshots/10-mock-interview-feedback.png)

At the end of your session, get a comprehensive summary with overall score, strengths, areas to improve, and practice recommendations.

![Mock Interview Summary](docs/screenshots/11-mock-interview-summary.png)

### 6. Generate Cover Letters

Click "Cover Letter" to generate tailored cover letters for your application.

![Cover Letter Generation](docs/screenshots/cover-letter-feature.png)

Configure your cover letter with:
- **Tone**: Formal, conversational, or enthusiastic
- **Length**: Short (2-3 paragraphs), medium (3-4), or long (4-5)
- **Use Analysis Insights**: Optionally incorporate strengths from your resume analysis

Generate multiple versions, edit inline, copy to clipboard, or download as text. All cover letters are saved and included in job exports.

## Quick Start Usage

1. **Create a Job Application** - Click "New Job Application" and enter the job details

2. **Upload Your Resume** - On the job detail page, upload your resume file or paste the text

3. **Run Resume Analysis** - Click "Analyze Resume" to get your fit score and interview questions

4. **Research the Company** - Click "Research Company" to gather company intelligence

5. **Practice Interviews** - Click "Mock Interview" to practice with AI feedback

6. **Generate Cover Letters** - Click "Cover Letter" to create tailored cover letters

7. **Chat with Your Data** - Use the chat interface for follow-up questions

8. **Export Reports** - Download your analysis, research, and cover letters as JSON or Markdown

## Project Structure

```
Job-ResumeEnhancer/
├── app/
│   ├── (dashboard)/          # Dashboard pages (route group)
│   │   ├── page.tsx          # Main dashboard
│   │   ├── jobs/
│   │   │   ├── page.tsx      # Jobs list
│   │   │   ├── new/          # New job form
│   │   │   └── [jobId]/      # Job detail & sub-pages
│   │   │       ├── resume-analysis/
│   │   │       ├── company-research/
│   │   │       ├── cover-letter/
│   │   │       ├── chat/
│   │   │       └── mock-interview/
│   │   └── layout.tsx        # Dashboard layout with sidebar
│   └── api/
│       ├── agents/           # AI agent endpoints (streaming)
│       ├── jobs/             # CRUD operations
│       ├── chat/             # Chat endpoint
│       ├── export/           # Report generation
│       ├── scrape/           # URL scraping
│       └── parse/            # Document parsing
├── components/
│   ├── ui/                   # Base UI components
│   ├── analysis/             # Resume analysis views
│   ├── research/             # Company research views
│   ├── cover-letter/         # Cover letter generation
│   ├── chat/                 # Chat interface
│   ├── mock-interview/       # Mock interview components
│   ├── dashboard/            # Layout components
│   └── jobs/                 # Job management
├── lib/
│   ├── db/                   # Drizzle schema & connection
│   ├── ai/                   # Azure OpenAI client & agents
│   ├── parsers/              # PDF, DOCX, TXT parsing
│   └── scrapers/             # Web scraping utilities
└── __tests__/                # Test files
```

## Development

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npx vitest run __tests__/components/analysis/fit-score-gauge.test.tsx

# Lint code
npm run lint

# Build for production
npm run build

# Database management
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
```

## CI/CD

This repo uses GitHub Actions for CI, plus an optional (manual) Vercel deploy workflow.

### CI (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

Runs on:
- `pull_request`
- `push` to `main`

What it runs:
- `npm ci`
- `npm run lint`
- `npm test` (Vitest)
- `npm run build`

Test tracking:
- CI uploads a `test-results` artifact containing `test-results/vitest.xml` (JUnit) for each run.

Build note:
- `npm run build` uses `next build --webpack` for better reliability in locked-down CI environments.

### CD (Vercel, optional)

Workflow: `.github/workflows/deploy-vercel.yml`

- Triggered manually via `workflow_dispatch` (Actions tab → “Deploy (Vercel)”).
- Requires GitHub Actions secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- If secrets are not set (e.g., in forks), the workflow exits successfully after printing a “Skipping deploy” message.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/jobs` | List/create job applications |
| GET/PUT/DELETE | `/api/jobs/[jobId]` | Job CRUD operations |
| POST | `/api/jobs/[jobId]/resume` | Upload resume |
| POST | `/api/agents/resume-analyzer` | Run resume analysis (streaming) |
| POST | `/api/agents/company-research` | Run company research (streaming) |
| POST | `/api/agents/mock-interviewer` | Mock interview agent (streaming) |
| POST | `/api/agents/cover-letter` | Generate cover letter (streaming) |
| GET/POST | `/api/jobs/[jobId]/cover-letters` | List/create cover letters |
| GET/PATCH/DELETE | `/api/jobs/[jobId]/cover-letters/[letterId]` | Cover letter operations |
| GET/POST | `/api/mock-interview/sessions` | List/create interview sessions |
| GET/PATCH/DELETE | `/api/mock-interview/sessions/[sessionId]` | Session operations |
| GET | `/api/mock-interview/analytics` | Performance metrics |
| POST | `/api/chat` | Chat with saved data (streaming) |
| POST | `/api/scrape` | Scrape job description URL |
| POST | `/api/parse` | Parse uploaded document |
| POST | `/api/export` | Generate report (JSON/Markdown) |

## Deployment

### Platform Requirements

This application uses SQLite with `better-sqlite3`, which requires:
- Node.js runtime (not Edge runtime)
- Filesystem access for database storage
- Native module compilation

**Supported Platforms:**
- Vercel (with Node.js runtime)
- Docker containers
- Traditional VPS (DigitalOcean, Linode, AWS EC2, etc.)
- Self-hosted servers

**NOT Supported:**
- Vercel Edge Functions
- Cloudflare Workers
- AWS Lambda (read-only filesystem)
- Any serverless platform without persistent filesystem

---

### Option 1: Deploy to Vercel (Recommended)

Vercel is the easiest deployment option for Next.js applications.

#### Prerequisites
- [Vercel account](https://vercel.com/signup)
- [Vercel CLI](https://vercel.com/cli) installed (optional)
- GitHub repository connected to Vercel

#### Step 1: Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect Next.js settings

#### Step 2: Configure Environment Variables

In the Vercel dashboard, go to **Settings → Environment Variables** and add:

```bash
# Required - Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-5.2
AZURE_OPENAI_API_VERSION=2024-07-01-preview

# Required - Database (Vercel creates this path automatically)
DATABASE_URL=file:./data/resume-enhancer.db

# Required - Authentication
AUTH_SECRET_TOKEN=your-secure-random-token-min-32-chars

# Optional - Web Search (falls back to DuckDuckGo)
BRAVE_SEARCH_API_KEY=your-brave-api-key

# Optional - Logging
LOG_LEVEL=warn
```

**Generate a secure AUTH_SECRET_TOKEN:**
```bash
openssl rand -base64 32
```

#### Step 3: Deploy

```bash
# Using Vercel CLI
vercel --prod

# Or push to main branch for automatic deployment
git push origin main
```

#### Step 4: Initialize Database

After the first deployment, the database will be created automatically when you first access the application.

#### Vercel Limitations

- **SQLite persistence**: Vercel's serverless functions have ephemeral filesystems. The SQLite database will reset on each deployment or cold start. For persistent data:
  - Use Vercel's KV, Postgres, or Blob storage
  - Or migrate to a cloud database (see Database Migration section)
- **Function timeout**: Default 10s (Pro: 60s, Enterprise: 900s). AI operations may need longer timeouts.

---

### Option 2: Deploy with Docker

Docker provides consistent deployments across any infrastructure.

#### Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:/app/data/resume-enhancer.db
      - AZURE_OPENAI_ENDPOINT=${AZURE_OPENAI_ENDPOINT}
      - AZURE_OPENAI_API_KEY=${AZURE_OPENAI_API_KEY}
      - AZURE_OPENAI_DEPLOYMENT=${AZURE_OPENAI_DEPLOYMENT}
      - AZURE_OPENAI_API_VERSION=${AZURE_OPENAI_API_VERSION}
      - AUTH_SECRET_TOKEN=${AUTH_SECRET_TOKEN}
      - BRAVE_SEARCH_API_KEY=${BRAVE_SEARCH_API_KEY}
      - LOG_LEVEL=warn
    volumes:
      - app-data:/app/data
    restart: unless-stopped

volumes:
  app-data:
```

#### Build and Run

```bash
# Create .env file with your credentials
cp .env.example .env
# Edit .env with your values

# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

#### Update next.config.ts for Standalone Output

Add to `next.config.ts`:

```typescript
const nextConfig = {
  output: 'standalone',
  // ... other config
};
```

---

### Option 3: Deploy to VPS (DigitalOcean, Linode, AWS EC2)

For traditional server deployment with full control.

#### Step 1: Server Setup

```bash
# SSH into your server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools (required for better-sqlite3)
sudo apt install -y build-essential python3

# Install PM2 for process management
sudo npm install -g pm2

# Install nginx (optional, for reverse proxy)
sudo apt install -y nginx
```

#### Step 2: Clone and Setup

```bash
# Clone repository
git clone https://github.com/robfosterdotnet/Job-ResumeEnhancer.git
cd Job-ResumeEnhancer

# Install dependencies
npm ci

# Create environment file
cp .env.example .env
nano .env  # Add your credentials

# Initialize database
npm run db:push

# Build application
npm run build
```

#### Step 3: Configure PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'job-resume-enhancer',
    script: 'npm',
    args: 'start',
    cwd: '/home/user/Job-ResumeEnhancer',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable startup on boot
```

#### Step 4: Configure Nginx (Recommended)

Create `/etc/nginx/sites-available/job-resume-enhancer`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;  # Longer timeout for AI operations
    }

    # Increase body size for resume uploads
    client_max_body_size 10M;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/job-resume-enhancer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 5: SSL with Certbot (Recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Database Migration (For Scalable Deployments)

If you need multi-instance deployments or serverless with persistent data, migrate from SQLite to a cloud database.

#### Option A: Turso (SQLite-compatible)

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create job-resume-enhancer

# Get connection URL
turso db show job-resume-enhancer --url

# Update .env
DATABASE_URL=libsql://your-db.turso.io?authToken=your-token
```

Update `lib/db/index.ts` to use `@libsql/client` instead of `better-sqlite3`.

#### Option B: PostgreSQL (Neon, Supabase, or self-hosted)

1. Create a PostgreSQL database
2. Update `lib/db/schema.ts` to use PostgreSQL types
3. Update `lib/db/index.ts` to use `drizzle-orm/postgres-js`
4. Run migrations: `npm run db:push`

---

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `AZURE_OPENAI_ENDPOINT` | Yes | Azure OpenAI resource endpoint |
| `AZURE_OPENAI_API_KEY` | Yes | Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT` | Yes | Model deployment name (e.g., gpt-5.2) |
| `AZURE_OPENAI_API_VERSION` | Yes | API version (e.g., 2024-07-01-preview) |
| `DATABASE_URL` | Yes | SQLite path (e.g., file:./data/resume-enhancer.db) |
| `AUTH_SECRET_TOKEN` | Yes* | Bearer token for API authentication (* required in production) |
| `BRAVE_SEARCH_API_KEY` | No | Brave Search API key (falls back to DuckDuckGo) |
| `LOG_LEVEL` | No | Logging level: debug, info, warn, error (default: warn in prod) |

---

### Authentication

All API routes require authentication in production. Include the bearer token in requests:

```bash
curl -H "Authorization: Bearer your-auth-secret-token" \
  https://your-domain.com/api/jobs
```

The frontend automatically includes the token from the `AUTH_SECRET_TOKEN` environment variable.

---

### Health Checks

The application exposes a health endpoint for monitoring:

```bash
curl https://your-domain.com/api/health
# Returns: { "status": "ok", "timestamp": "..." }
```

---

### Troubleshooting

**Build fails with `better-sqlite3` errors:**
```bash
# Install build dependencies
npm install -g node-gyp
sudo apt install -y build-essential python3
npm rebuild better-sqlite3
```

**Database permission errors:**
```bash
# Ensure data directory exists and is writable
mkdir -p data
chmod 755 data
```

**AI requests timeout:**
- Increase server timeout settings (nginx: `proxy_read_timeout`, Vercel: function duration)
- AI operations can take 30-60 seconds for complex analyses

**Memory issues:**
- Minimum recommended: 1GB RAM
- For heavy usage: 2GB+ RAM
- Monitor with `pm2 monit` or your hosting dashboard

## Design

The UI uses Anthropic's brand colors:

- **Primary**: #E5674C (Coral)
- **Background**: #FAFAFA
- **Foreground**: #1A1A2E (Dark navy)
- **Success**: #10B981
- **Warning**: #F59E0B
- **Error**: #EF4444

## Documentation

- **SPECIFICATION.md** - Complete technical specification with implementation details
- **CLAUDE.md** - AI assistant guidance for working with this codebase

## License

MIT
