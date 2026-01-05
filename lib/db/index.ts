import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import * as schema from "./schema"
import path from "path"
import fs from "fs"

// Environment checks
if (typeof window !== "undefined") {
  throw new Error("Database cannot be used in browser environment")
}

// Check for Edge runtime - SQLite requires Node.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((globalThis as any).EdgeRuntime) {
  throw new Error(
    "SQLite is not supported in Edge runtime. Ensure your API routes use 'export const runtime = \"nodejs\"'"
  )
}

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = process.env.DATABASE_URL?.replace("file:", "") || path.join(dataDir, "resume-enhancer.db")

const sqlite = new Database(dbPath, { timeout: 30000 })
try {
  sqlite.pragma("journal_mode = WAL")
} catch (error) {
  const code = (error as { code?: string } | null)?.code
  if (code !== "SQLITE_BUSY") throw error
}

export const db = drizzle(sqlite, { schema })

export type Database = typeof db
