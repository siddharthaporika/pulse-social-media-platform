import { OwnProfile } from "@/components/own-profile"
import { Navigation } from "@/components/navigation"

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <OwnProfile />
      </main>
    </div>
  )
}
