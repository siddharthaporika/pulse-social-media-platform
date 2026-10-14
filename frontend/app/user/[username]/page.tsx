import UserProfile from "@/components/[username]"
import { Navigation } from "@/components/navigation"
export default function UserProfilePage({ params }: { params: { username: string } }) {
   const uname = decodeURIComponent(params.username || "");
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <UserProfile username={uname} />
      </main>
    </div>
  )
}
