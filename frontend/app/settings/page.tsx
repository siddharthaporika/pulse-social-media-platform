import { SettingsForm } from "@/components/settings-form"
import { Navigation } from "@/components/navigation"

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <SettingsForm />
      </main>
    </div>
  )
}
