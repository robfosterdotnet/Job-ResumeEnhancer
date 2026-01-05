import { Header } from "@/components/dashboard/header"
import { SettingsForm } from "@/components/settings/settings-form"

export const dynamic = "force-dynamic"

export default function SettingsPage() {
  return (
    <div className="flex flex-col">
      <Header title="Settings" />
      <div className="p-6">
        <SettingsForm />
      </div>
    </div>
  )
}
