import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import * as schema from "./schema"
import path from "path"
import fs from "fs"

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = process.env.DATABASE_URL?.replace("file:", "") || path.join(dataDir, "resume-enhancer.db")

const sqlite = new Database(dbPath)
sqlite.pragma("journal_mode = WAL")

export const db = drizzle(sqlite, { schema })

export type Database = typeof db
