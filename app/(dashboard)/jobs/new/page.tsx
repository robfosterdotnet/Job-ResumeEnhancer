import { Header } from "@/components/dashboard/header"
import { JobForm } from "@/components/jobs/job-form"

export default function NewJobPage() {
  return (
    <div className="flex flex-col">
      <Header title="New Job Application" />

      <div className="p-6 max-w-3xl">
        <JobForm />
      </div>
    </div>
  )
}
