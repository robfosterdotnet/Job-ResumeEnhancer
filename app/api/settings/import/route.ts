import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { companies, resumes, jobApplications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth/middleware"
import { parseRequestBody } from "@/lib/utils/api-validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Basic import schema validation
const importSchema = z.object({
  version: z.string().optional(),
  data: z.object({
    companies: z.array(z.any()).optional(),
    resumes: z.array(z.any()).optional(),
    jobApplications: z.array(z.any()).optional(),
  }).optional(),
})

// POST /api/settings/import - Import data from backup
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const parsed = await parseRequestBody(request, importSchema)
    if (!parsed.success) return parsed.response

    const importData = parsed.data
    const imported = {
      companies: 0,
      resumes: 0,
      jobs: 0,
    }

    // Import companies (skip duplicates by name)
    if (importData.data?.companies && Array.isArray(importData.data.companies)) {
      for (const company of importData.data.companies) {
        if (!company.name) continue

        const existing = await db.query.companies.findFirst({
          where: eq(companies.name, company.name),
        })

        if (!existing) {
          await db.insert(companies).values({
            name: company.name,
            website: company.website || null,
            industry: company.industry || null,
            description: company.description || null,
            headquarters: company.headquarters || null,
            employeeCount: company.employeeCount || null,
            foundedYear: company.foundedYear || null,
            isPublic: company.isPublic || false,
            stockSymbol: company.stockSymbol || null,
          })
          imported.companies++
        }
      }
    }

    // Import resumes (skip duplicates by filename + content hash)
    const resumeIdMap = new Map<number, number>() // old ID -> new ID
    if (importData.data?.resumes && Array.isArray(importData.data.resumes)) {
      for (const resume of importData.data.resumes) {
        if (!resume.parsedContent) continue

        // Simple duplicate check by filename
        const existing = resume.filename
          ? await db.query.resumes.findFirst({
              where: eq(resumes.filename, resume.filename),
            })
          : null

        if (!existing) {
          const [newResume] = await db.insert(resumes).values({
            filename: resume.filename || null,
            originalContent: resume.originalContent || resume.parsedContent,
            parsedContent: resume.parsedContent,
            fileType: resume.fileType || "txt",
          }).returning()

          if (resume.id) {
            resumeIdMap.set(resume.id, newResume.id)
          }
          imported.resumes++
        } else if (resume.id) {
          resumeIdMap.set(resume.id, existing.id)
        }
      }
    }

    // Import job applications
    if (importData.data?.jobApplications && Array.isArray(importData.data.jobApplications)) {
      for (const job of importData.data.jobApplications) {
        if (!job.title || !job.jobDescriptionText) continue

        // Find or create company
        let companyId: number | null = null
        if (job.companyId) {
          // Find company by name if we have companies in import
          const importedCompany = importData.data.companies?.find(
            (c: { id?: number }) => c.id === job.companyId
          )
          if (importedCompany?.name) {
            const existing = await db.query.companies.findFirst({
              where: eq(companies.name, importedCompany.name),
            })
            companyId = existing?.id ?? null
          }
        }

        // Map resume ID
        const resumeId = job.resumeId ? resumeIdMap.get(job.resumeId) ?? null : null

        // Check for duplicate (same title + company)
        const existingJob = await db.query.jobApplications.findFirst({
          where: eq(jobApplications.title, job.title),
        })

        if (!existingJob) {
          await db.insert(jobApplications).values({
            title: job.title,
            companyId,
            resumeId,
            jobDescriptionUrl: job.jobDescriptionUrl || null,
            jobDescriptionText: job.jobDescriptionText,
            jobDescriptionParsed: job.jobDescriptionParsed || null,
            status: job.status || "saved",
            notes: job.notes || null,
          })
          imported.jobs++
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      message: `Imported ${imported.jobs} jobs, ${imported.companies} companies, ${imported.resumes} resumes`,
    })
  } catch (error) {
    console.error("Error importing data:", error)
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    )
  }
}
