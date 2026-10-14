"use client"

import { useState } from "react"
import Image from "next/image"
import { Shield, Check, X } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ReportedPost {
  id: string
  username: string
  avatar: string
  content: string
  image?: string
  reportReason: string
  reportedBy: string
  reportDate: string
}

// Mock reported posts data
const initialReportedPosts: ReportedPost[] = [
  {
    id: "1",
    username: "suspicious_user",
    avatar: "/reported-user-1.png",
    content: "This is potentially inappropriate content that was reported by users.",
    image: "/reported-post-1.png",
    reportReason: "Inappropriate content",
    reportedBy: "user123",
    reportDate: "2024-01-15",
  },
  {
    id: "2",
    username: "spam_account",
    avatar: "/reported-user-2.png",
    content: "Buy now! Click this link for amazing deals! Limited time offer!",
    reportReason: "Spam",
    reportedBy: "user456",
    reportDate: "2024-01-14",
  },
  {
    id: "3",
    username: "fake_profile",
    avatar: "/reported-user-3.png",
    content: "Impersonating a celebrity or public figure.",
    image: "/reported-post-2.png",
    reportReason: "Impersonation",
    reportedBy: "user789",
    reportDate: "2024-01-13",
  },
]

export function ReportedContent() {
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>(initialReportedPosts)

  const handleKeep = (postId: string) => {
    console.log("[v0] Keeping post:", postId)
    setReportedPosts(reportedPosts.filter((post) => post.id !== postId))
  }

  const handleRemove = (postId: string) => {
    console.log("[v0] Removing post:", postId)
    setReportedPosts(reportedPosts.filter((post) => post.id !== postId))
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <Shield className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reported Content</h1>
          <p className="text-sm text-muted-foreground">Review and moderate flagged posts</p>
        </div>
      </div>

      {reportedPosts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No reported content</p>
            <p className="text-sm text-muted-foreground">All reports have been reviewed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reportedPosts.map((post) => (
            <Card key={post.id} className="border-destructive/20">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.avatar || "/placeholder.svg"} alt={post.username} />
                      <AvatarFallback>{post.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{post.username}</p>
                      <p className="text-xs text-muted-foreground">Reported on {post.reportDate}</p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                    {post.reportReason}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-3">
                <p className="text-sm leading-relaxed">{post.content}</p>
                {post.image && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <Image src={post.image || "/placeholder.svg"} alt="Reported post" fill className="object-cover" />
                  </div>
                )}
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Reported by:</span> {post.reportedBy}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 pt-0">
                <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={() => handleKeep(post.id)}>
                  <Check className="h-4 w-4" />
                  Keep Post
                </Button>
                <Button variant="destructive" className="flex-1 gap-2" onClick={() => handleRemove(post.id)}>
                  <X className="h-4 w-4" />
                  Remove Post
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
