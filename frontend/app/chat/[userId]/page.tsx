import { ChatView } from "@/components/chat-view"
import { Navigation } from "@/components/navigation"

export default function ChatPage({ params }: { params: { userId: string } }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <ChatView userId={params.userId} />
      </main>
    </div>
  )
}
