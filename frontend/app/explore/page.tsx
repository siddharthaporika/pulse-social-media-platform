import { ExploreFeed } from "@/components/explore-feed"
import { Navigation } from "@/components/navigation"

export default function ExplorePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <ExploreFeed />
      </main>
    </div>
  )
}
