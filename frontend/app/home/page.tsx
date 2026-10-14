import HomeFeed from "@/components/home-feed"
import { Navigation } from "@/components/navigation"

export default function HomeFollowingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <HomeFeed />
      </main>
    </div>
  )
}
