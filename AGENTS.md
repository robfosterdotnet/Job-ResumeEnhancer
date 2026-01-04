# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router pages and API routes (`app/api/**/route.ts`).
- `components/`: React UI, grouped by feature (`analysis/`, `research/`, `chat/`, `mock-interview/`, `jobs/`, `ui/`).
- `lib/`: shared logic (AI clients/prompts in `lib/ai/`, DB schema in `lib/db/schema.ts`, parsers/scrapers in `lib/parsers/` and `lib/scrapers/`).
- `__tests__/`: Vitest tests, typically mirroring component paths (e.g., `__tests__/components/analysis/*.test.tsx`).
- `docs/`: documentation assets (screenshots live in `docs/screenshots/`).

## Build, Test, and Development Commands

This repo uses `npm` (see `package-lock.json`).

```bash
npm install         # Install dependencies
npm run dev         # Start Next.js dev server
npm run build       # Production build
npm run start       # Run built app locally
npm run lint        # ESLint (repo-wide)
npm run test        # Run Vitest once (CI-style)
npm run test:watch  # Watch mode
npm run db:push     # Apply Drizzle schema to local SQLite
npm run db:studio   # Inspect DB with Drizzle Studio
```

## Coding Style & Naming Conventions

- TypeScript + React (Next.js). Prefer small, typed helpers in `lib/` over duplicating logic in routes/components.
- Indentation: 2 spaces; keep imports sorted and avoid unused exports (ESLint enforces most rules).
- File naming: `kebab-case.ts(x)` for components; component identifiers in `PascalCase`.
- API routes: `app/api/<feature>/route.ts`; keep handlers thin and validate AI outputs with Zod schemas in `lib/ai/agents/`.

## Testing Guidelines

- Framework: Vitest + React Testing Library (`vitest.config.ts`).
- Name tests `*.test.ts` / `*.test.tsx` under `__tests__/`.
- Run one file:
  `npx vitest run __tests__/components/analysis/fit-score-gauge.test.tsx`

## Commit & Pull Request Guidelines

- Commits in this repo are short, imperative sentences (e.g., “Add testing requirements…”). Releases use “Release vX.Y - <summary>”.
- PRs: include a clear description, testing notes (`npm run test`, `npm run lint`), and screenshots for UI changes (update `docs/screenshots/` when relevant).

## Security & Configuration Tips

- Do not commit secrets: `.env*` is ignored; when adding new env vars, update `.env.example`.
- Local SQLite files and `data/` are ignored; use `DATABASE_URL=file:./data/resume-enhancer.db` for development.
