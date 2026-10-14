import { ReportedContent } from "@/components/reported-content"
import { Navigation } from "@/components/navigation"

export default function ReportedContentPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <ReportedContent />
      </main>
    </div>
  )
}
