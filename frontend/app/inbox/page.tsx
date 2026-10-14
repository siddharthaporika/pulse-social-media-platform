import InboxList from "@/components/inbox-list"
import { Navigation } from "@/components/navigation"
export default function Page() {
  return  <div className="flex min-h-screen flex-col">
          <Navigation />
            <main className="flex-1">
            <InboxList />
            </main>
          </div>
}


