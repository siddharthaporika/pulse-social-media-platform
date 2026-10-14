"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Settings, Grid, List, Type } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PostCard } from "@/components/post-card";

type User = {
  id: string; username: string; name: string; bio?: string | null; avatarUrl?: string | null;
  followerCount: number; followingCount: number; postcount: number;
};

type Post = {
  id: string; mediaUrl?: string | null; caption?: string | null; postType: "TEXT"|"IMAGE"|"VIDEO";
  postedAt: string; likeCount: number; commentCount: number;
};

type LiteUser = { id: string; username: string; avatarUrl?: string | null }

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }
function buildAuthHeaders(): Record<string, string> { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; }

function decodeExp(token: string): number | null {
  try { const payload = JSON.parse(atob(token.split(".")[1] || "")); return typeof payload?.exp === "number" ? payload.exp : null; }
  catch { return null; }
}

export function OwnProfile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "text">("grid");
  const [loading, setLoading] = useState(true);

  // Followers / Following modal state
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [followers, setFollowers] = useState<LiteUser[]>([]);
  const [following, setFollowing] = useState<LiteUser[]>([]);
  const [listsLoading, setListsLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const token = getToken();
        if (!token) { router.replace("/login"); return; }
        const exp = decodeExp(token);
        if (!exp || exp * 1000 <= Date.now()) { localStorage.removeItem("token"); router.replace("/login"); return; }

        const meRes = await fetch(`${API}/auth/me`, { headers: buildAuthHeaders(), cache: "no-store", signal: ctrl.signal });
        if (meRes.status === 401) { localStorage.removeItem("token"); router.replace("/login"); return; }
        if (!meRes.ok) throw new Error(`Failed /auth/me (${meRes.status})`);
        const me: User = await meRes.json();
        setUser(me);

        const pRes = await fetch(`${API}/users/${me.id}/posts`, { headers: buildAuthHeaders(), cache: "no-store", signal: ctrl.signal });
        const arr = pRes.ok ? await pRes.json() : [];
        const mapped: Post[] = Array.isArray(arr)
          ? arr.map((p: any) => ({
              id: String(p.id), mediaUrl: p.mediaUrl || null, caption: p.caption ?? null,
              postType: p.postType, postedAt: p.postedAt, likeCount: p.likeCount ?? 0, commentCount: p.commentCount ?? 0,
            }))
          : [];
        setPosts(mapped);
      } catch (err: any) {
        if (err?.name !== "AbortError") console.error(err);
      } finally { if (!ctrl.signal.aborted) setLoading(false); }
    })();
    return () => ctrl.abort();
  }, [router]);

  // Support deep-link ?post=<id> → open list view & scroll
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const pid = url.searchParams.get("post");
    if (!pid) return;
    if (!posts.length) return;
    setViewMode("list");
    setTimeout(() => { const el = document.getElementById(`post-${pid}`); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80);
  }, [posts]);

  async function openFollowers() {
    if (!user) return;
    setFollowersOpen(true); setFollowingOpen(false); setListsLoading(true);
    try {
      const res = await fetch(`${API}/users/${user.id}/followers`, { headers: buildAuthHeaders() });
      const data: any[] = res.ok ? await res.json() : [];
      setFollowers(data.map((u: any) => ({ id: u.id, username: u.username, avatarUrl: u.avatarUrl ?? null })));
    } finally { setListsLoading(false); }
  }
  async function openFollowing() {
    if (!user) return;
    setFollowingOpen(true); setFollowersOpen(false); setListsLoading(true);
    try {
      const res = await fetch(`${API}/users/${user.id}/following`, { headers: buildAuthHeaders() });
      const data: any[] = res.ok ? await res.json() : [];
      setFollowing(data.map((u: any) => ({ id: u.id, username: u.username, avatarUrl: u.avatarUrl ?? null })));
    } finally { setListsLoading(false); }
  }

  async function blockUser(targetId: string) {
    await fetch(`${API}/users/${targetId}/block`, { method: "POST", headers: { "Content-Type": "application/json", ...buildAuthHeaders() } });
  }
  async function unblockUser(targetId: string) {
    await fetch(`${API}/users/${targetId}/block`, { method: "DELETE", headers: { ...buildAuthHeaders() } });
  }

  if (loading) return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6" aria-live="polite">
      <div className="animate-pulse overflow-hidden rounded-3xl border border-border/70 bg-card">
        <div className="h-28 bg-gradient-to-r from-primary/10 via-secondary to-primary/5 sm:h-36" />
        <div className="p-5 sm:p-8">
          <div className="-mt-14 mb-5 h-24 w-24 rounded-full border-4 border-card bg-muted sm:-mt-16 sm:h-28 sm:w-28" />
          <div className="mb-3 h-5 w-40 rounded bg-muted" />
          <div className="h-3 w-64 max-w-full rounded bg-muted" />
        </div>
      </div>
    </div>
  );
  if (!user) return <div className="mx-auto max-w-5xl px-4 py-12 text-center text-muted-foreground">You’re not logged in. Please sign in to view your profile.</div>;

  const listSource = viewMode === "text" ? posts.filter((p) => p.postType === "TEXT") : posts;

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm" aria-labelledby="profile-heading">
        <div className="relative h-28 overflow-hidden bg-gradient-to-r from-primary/15 via-secondary to-primary/5 sm:h-40">
          <div className="absolute -right-8 -top-16 h-48 w-48 rounded-full border-[24px] border-background/20 sm:h-64 sm:w-64" />
          <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-primary/10 blur-2xl sm:h-56 sm:w-56" />
        </div>
        <div className="px-4 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:gap-6">
            <Avatar className="h-24 w-24 shrink-0 border-4 border-card shadow-md sm:h-28 sm:w-28">
              <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={`${user.username}'s profile photo`} />
              <AvatarFallback>{user.username?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your space on Pulse</p>
                <h1 id="profile-heading" className="break-words text-2xl font-bold tracking-tight sm:text-3xl">{user.name || user.username}</h1>
                <p className="mt-1 text-sm text-muted-foreground">@{user.username}</p>
              </div>
              <Button asChild variant="outline" className="w-full rounded-xl sm:w-auto">
                <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> Edit profile</Link>
              </Button>
            </div>
          </div>

          <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-foreground/85">
            {user.bio?.trim() || "Add a short bio to introduce yourself to the community."}
          </p>

          <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border/70 bg-secondary/30 py-3 sm:max-w-lg">
            <div className="px-2 text-center">
              <p className="text-xl font-bold tabular-nums">{posts.length}</p>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Posts</p>
            </div>
            <button onClick={openFollowers} className="rounded-md px-2 text-center transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`View ${user.followerCount} followers`}>
              <p className="text-xl font-bold tabular-nums">{user.followerCount}</p>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Followers</p>
            </button>
            <button onClick={openFollowing} className="rounded-md px-2 text-center transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`View ${user.followingCount} following`}>
              <p className="text-xl font-bold tabular-nums">{user.followingCount}</p>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Following</p>
            </button>
          </div>
        </div>
      </section>

      <section className="mt-7" aria-labelledby="posts-heading">
        <div className="mb-4 flex flex-col gap-3 border-b border-border/80 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="posts-heading" className="text-xl font-bold tracking-tight">Your posts</h2>
            <p className="mt-1 text-sm text-muted-foreground">A little collection of what you’ve shared.</p>
          </div>
          <div className="flex items-center gap-1 self-start rounded-xl border border-border/70 bg-card p-1 sm:self-auto" role="group" aria-label="Post display mode">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="rounded-lg" onClick={() => setViewMode("grid")} aria-label="Grid view" aria-pressed={viewMode === "grid"}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="rounded-lg" onClick={() => setViewMode("list")} aria-label="List view" aria-pressed={viewMode === "list"}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "text" ? "secondary" : "ghost"} size="icon" className="rounded-lg" onClick={() => setViewMode("text")} title="Text-only" aria-label="Text posts only" aria-pressed={viewMode === "text"}>
              <Type className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!posts.length ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-14 text-center sm:py-16">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground"><Grid className="h-6 w-6" /></div>
            <h3 className="mt-4 text-lg font-semibold">Your story starts here</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">You haven’t shared anything yet. Create a post to give your community something to see.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button asChild className="rounded-xl"><Link href="/create/text">Write a post</Link></Button>
              <Button asChild variant="outline" className="rounded-xl"><Link href="/create/media">Share a photo</Link></Button>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3">
            {posts.map((post) => (
              <button key={post.id} type="button" aria-label={`Open post: ${post.caption || "Untitled post"}`} className="group relative aspect-square overflow-hidden rounded-xl bg-secondary text-left ring-offset-background transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:rounded-2xl"
                onClick={() => { setViewMode("list"); window.setTimeout(() => { const el = document.getElementById(`post-${post.id}`); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80); }}>
                {post.mediaUrl && post.postType === "VIDEO" ? (
                  <video src={post.mediaUrl} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" aria-label={post.caption || "Video post"} />
                ) : post.mediaUrl && post.postType === "IMAGE" ? (
                  <Image src={post.mediaUrl} alt={post.caption || "Post media"} fill className="object-cover transition duration-300 group-hover:scale-105" unoptimized />
                ) : (
                  <div className="flex h-full flex-col justify-between bg-gradient-to-br from-secondary via-card to-primary/10 p-3 sm:p-5">
                    <Type className="h-5 w-5 text-muted-foreground" />
                    <p className="line-clamp-5 break-words text-sm font-medium leading-5 sm:text-base">{post.caption || "A text post"}</p>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span>♥ {post.likeCount} · {post.commentCount} comments</span>
                </div>
              </button>
            ))}
          </div>
        ) : listSource.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">No text posts yet. Try another view or share your first text post.</div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {listSource.map((post) => (
              <PostCard
                key={post.id}
                cardId={`post-${post.id}`}
                post={{
                  id: post.id,
                  username: user.username,
                  avatar: user.avatarUrl || "/placeholder.svg",
                  content: post.caption ?? "",
                  image: post.postType === "IMAGE" || post.postType === "VIDEO" ? post.mediaUrl ?? undefined : undefined,
                  mediaType: post.postType === "VIDEO" ? "VIDEO" : "IMAGE",
                  likes: post.likeCount,
                  comments: post.commentCount,
                  timestamp: new Date(post.postedAt).toLocaleDateString(),
                  viewerLiked: false,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Followers modal */}
      {followersOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-3 backdrop-blur-sm sm:p-6">
          <Card className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="font-semibold">Followers</div>
              <Button variant="ghost" size="sm" onClick={() => setFollowersOpen(false)}>Close</Button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-2">
              {listsLoading ? <div className="p-4 text-sm text-muted-foreground">Loading…</div> :
                followers.length === 0 ? <div className="p-4 text-sm text-muted-foreground">No followers</div> :
                followers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-3 rounded-md p-3 hover:bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9"><AvatarImage src={u.avatarUrl || "/placeholder.svg"} /><AvatarFallback>{u.username?.[0]?.toUpperCase() || "U"}</AvatarFallback></Avatar>
                      <Link href={`/user/${u.username}`} className="text-sm font-medium hover:underline">{u.username}</Link>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => blockUser(u.id)}>Block</Button>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* Following modal */}
      {followingOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-3 backdrop-blur-sm sm:p-6">
          <Card className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="font-semibold">Following</div>
              <Button variant="ghost" size="sm" onClick={() => setFollowingOpen(false)}>Close</Button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-2">
              {listsLoading ? <div className="p-4 text-sm text-muted-foreground">Loading…</div> :
                following.length === 0 ? <div className="p-4 text-sm text-muted-foreground">No following</div> :
                following.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-3 rounded-md p-3 hover:bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9"><AvatarImage src={u.avatarUrl || "/placeholder.svg"} /><AvatarFallback>{u.username?.[0]?.toUpperCase() || "U"}</AvatarFallback></Avatar>
                      <Link href={`/user/${u.username}`} className="text-sm font-medium hover:underline">{u.username}</Link>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default OwnProfile;
