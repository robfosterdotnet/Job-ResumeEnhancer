import { Header } from "@/components/dashboard/header"
import { db } from "@/lib/db"
import { JobSearchClient } from "./job-search-client"

async function getMasterResumeId(): Promise<number | null> {
  const settings = await db.query.userSettings.findFirst({
    with: {
      masterResume: true,
    },
  })
  return settings?.masterResumeId ?? null
}

export default async function FindJobsPage() {
  const masterResumeId = await getMasterResumeId()

  return (
    <div className="flex flex-col">
      <Header title="Find Jobs" />
      <div className="p-6">
        <JobSearchClient masterResumeId={masterResumeId} />
      </div>
    </div>
  )
}
