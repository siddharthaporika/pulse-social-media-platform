"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, FileText, ImagePlus, RefreshCw, Sparkles } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";

 type FeedPost = {
  id: string;
  caption: string;
  postedAt: string;
  mediaUrl?: string | null;
  postType?: "TEXT" | "IMAGE" | "VIDEO" | null;
  likeCount?: number;
  commentCount?: number;
  viewerLiked?: boolean;
  author: { id: string; username: string; avatarUrl?: string | null };
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function buildAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function timeAgo(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function HomeFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadPosts() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API}/posts`, {
          headers: buildAuthHeaders(),
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(response.status === 401 ? "Please log in to view your feed." : "Could not load posts. Please try again.");
        const data: unknown = await response.json();
        if (!controller.signal.aborted) setPosts(Array.isArray(data) ? data as FeedPost[] : []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong while loading your feed.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadPosts();
    return () => controller.abort();
  }, [refreshKey]);

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-3 py-5 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
      <section className="mx-auto w-full max-w-2xl lg:mx-0" aria-labelledby="feed-heading">
        <div className="mb-6 rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-secondary/70 p-5 shadow-sm sm:p-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Your community, in one place
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 id="feed-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">Your feed<span className="text-primary">.</span></h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">Catch up with people you follow and share a little of your world.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-xl"><Link href="/create/text"><FileText className="mr-2 h-4 w-4" /> Write a post</Link></Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl"><Link href="/create/media"><ImagePlus className="mr-2 h-4 w-4" /> Add media</Link></Button>
            </div>
          </div>
        </div>

        {loading && posts.length === 0 ? (
          <div className="space-y-4" aria-label="Loading feed" aria-live="polite">
            {[0, 1, 2].map((item) => <div key={item} className="animate-pulse rounded-2xl border border-border/70 bg-card p-5"><div className="mb-4 flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-muted" /><div className="flex-1 space-y-2"><div className="h-3 w-28 rounded bg-muted" /><div className="h-2.5 w-16 rounded bg-muted" /></div></div><div className="space-y-2"><div className="h-3 w-full rounded bg-muted" /><div className="h-3 w-4/5 rounded bg-muted" /></div><div className="mt-4 h-56 rounded-xl bg-muted" /></div>)}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/20 bg-card p-8 text-center shadow-sm">
            <p className="font-semibold">Your feed couldn’t load</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{error}</p>
            <Button className="mt-5 rounded-xl" onClick={() => setRefreshKey((key) => key + 1)}><RefreshCw className="mr-2 h-4 w-4" /> Try again</Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-sm">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary"><Compass className="h-6 w-6 text-muted-foreground" /></div>
            <h2 className="mt-4 text-lg font-semibold">It’s quiet here for now</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Follow people or publish your first post to start filling your feed with new ideas.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2"><Button asChild className="rounded-xl"><Link href="/create/text">Create a post</Link></Button><Button asChild variant="outline" className="rounded-xl"><Link href="/explore">Explore people</Link></Button></div>
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={{
                id: post.id,
                username: post.author?.username || "unknown",
                avatar: post.author?.avatarUrl || "/placeholder.svg",
                content: post.caption || "",
                image: post.postType === "IMAGE" || post.postType === "VIDEO" ? post.mediaUrl ?? undefined : undefined,
                mediaType: post.postType === "VIDEO" ? "VIDEO" : "IMAGE",
                likes: post.likeCount ?? 0,
                comments: post.commentCount ?? 0,
                timestamp: timeAgo(post.postedAt),
                viewerLiked: !!post.viewerLiked,
              }} />
            ))}
          </div>
        )}
      </section>

      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <h2 className="font-semibold">Make it yours</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Add a profile photo and a short bio so people can get to know you.</p>
            <Button asChild variant="outline" className="mt-4 w-full rounded-xl"><Link href="/settings">Edit your profile</Link></Button>
          </div>
          <p className="px-1 text-xs leading-5 text-muted-foreground">Be kind, share thoughtfully, and keep your community welcoming.</p>
        </div>
      </aside>
    </div>
  );
}
