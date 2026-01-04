# Job Resume Enhancer

A personal job search tool that analyzes your resume against job postings and deeply researches companies before applying. Built with Next.js, Azure OpenAI, and Anthropic-inspired design.

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
- Deep dive into any company using web search
- Leadership team profiles (CEO, executives, board members)
- Financial information (revenue, market cap, growth trends)
- Employee reviews and culture insights (Glassdoor-style)
- Recent news with sentiment analysis
- Legal issues and regulatory concerns
- Ethics alignment scoring

### Application Tracking
- Manage multiple job applications in one dashboard
- Track status: Saved → Analyzing → Applied → Interviewing → Offered
- Chat with your saved research data
- Export reports as JSON or Markdown

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16+ (App Router) + TypeScript |
| AI | Azure OpenAI (gpt-5.2 deployment) |
| Database | SQLite + Drizzle ORM |
| Web Search | DuckDuckGo (duck-duck-scrape) |
| UI | Tailwind CSS v4 + shadcn/ui + Anthropic brand colors |
| Testing | Vitest + React Testing Library |

## Getting Started

### Prerequisites

- Node.js 18+
- Azure OpenAI API access with a gpt-5.2 (or compatible) deployment

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Job-ResumeEnhancer.git
cd Job-ResumeEnhancer

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Azure OpenAI credentials

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
```

## Usage

1. **Create a Job Application** - Click "New Job Application" and enter the job title, company name, and job description (URL or text)

2. **Upload Your Resume** - On the job detail page, upload your resume file or paste the text

3. **Run Resume Analysis** - Click "Analyze Resume" to get your fit score, strengths, weaknesses, and interview questions

4. **Research the Company** - Click "Research Company" to gather leadership, financials, news, and ethics information

5. **Chat with Your Data** - Use the chat interface to ask follow-up questions about your analysis or research

6. **Export Reports** - Download your analysis and research as JSON or Markdown files

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
│   │   │       └── chat/
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
│   ├── chat/                 # Chat interface
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

## Database Schema

### Core Tables
- `resumes` - Uploaded resume files and parsed content
- `companies` - Company information
- `jobApplications` - Job applications with status tracking

### Analysis Tables
- `resumeAnalyses` - Fit scores, strengths, weaknesses, suggestions
- `interviewQuestions` - Generated questions with answers

### Research Tables
- `companyResearch` - Research summaries and ethics alignment
- `leadershipTeam` - Executive profiles
- `financialInfo` - Revenue, market cap, stock data
- `companyNews` - News articles with sentiment
- `legalIssues` - Lawsuits and regulatory issues
- `glassdoorInsights` - Employee ratings and reviews

### Chat Tables
- `chatSessions` - Chat session metadata
- `chatMessages` - Individual messages

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/jobs` | List/create job applications |
| GET/PUT/DELETE | `/api/jobs/[jobId]` | Job CRUD operations |
| POST | `/api/jobs/[jobId]/resume` | Upload resume |
| POST | `/api/agents/resume-analyzer` | Run resume analysis (streaming) |
| POST | `/api/agents/company-research` | Run company research (streaming) |
| POST | `/api/chat` | Chat with saved data (streaming) |
| POST | `/api/scrape` | Scrape job description URL |
| POST | `/api/parse` | Parse uploaded document |
| POST | `/api/export` | Generate report (JSON/Markdown) |

## Design

The UI uses Anthropic's brand colors:

- **Primary**: #E5674C (Coral)
- **Background**: #FAFAFA
- **Foreground**: #1A1A2E (Dark navy)
- **Success**: #10B981
- **Warning**: #F59E0B
- **Error**: #EF4444

## Testing

The project includes 53 tests covering:

- Analysis components (FitScoreGauge, StrengthsWeaknesses, InterviewQuestions)
- Research components (CompanyOverview, LegalIssues)
- Chat components (ChatMessage, ChatInput)

Run tests with:
```bash
npm run test
```

## Documentation

- **SPECIFICATION.md** - Complete technical specification with implementation details
- **CLAUDE.md** - AI assistant guidance for working with this codebase

## License

MIT
