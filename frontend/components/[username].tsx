"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Grid, List, Lock, MessageCircle, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BlockButton from "@/components/block-button";

interface UserProfileProps { username: string }
type ViewMode = "grid" | "list";
type FollowStatus = "NONE" | "REQUESTED" | "FOLLOWING";
type ProfilePost = { id: string; caption?: string | null; postType: "TEXT" | "IMAGE" | "VIDEO"; mediaUrl?: string | null; postedAt: string };
type UserData = {
  id: string; username: string; name?: string | null; avatarUrl?: string | null; bio?: string | null;
  followerCount: number; followingCount: number; postCount: number; accountType: "PUBLIC" | "PRIVATE";
  isSelf: boolean; followStatus: FollowStatus; postsList: ProfilePost[]; postsGrid: ProfilePost[];
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function numberLabel(value: number) { return new Intl.NumberFormat().format(value || 0); }

export default function UserProfile({ username }: UserProfileProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    if (!username) return;
    const response = await fetch(`${API}/users/by-username/${encodeURIComponent(username)}`, {
      headers: authHeaders(), cache: "no-store",
    });
    if (!response.ok) throw new Error(response.status === 404 ? "This profile could not be found." : "Unable to load this profile.");
    const raw = await response.json();
    setUser({
      id: raw.id, username: raw.username, name: raw.name ?? null, avatarUrl: raw.avatarUrl ?? null,
      bio: raw.bio ?? null, followerCount: raw.followerCount ?? 0, followingCount: raw.followingCount ?? 0,
      postCount: raw.postCount ?? raw.postcount ?? 0, accountType: raw.accountType === "PRIVATE" ? "PRIVATE" : "PUBLIC",
      isSelf: !!raw.isSelf, followStatus: raw.followStatus === "REQUESTED" ? "REQUESTED" : raw.followStatus === "FOLLOWING" ? "FOLLOWING" : "NONE",
      postsList: Array.isArray(raw.postsList) ? raw.postsList : [], postsGrid: Array.isArray(raw.postsGrid) ? raw.postsGrid : [],
    });
  }, [username]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    refreshUser().catch((err) => { if (active) setError(err instanceof Error ? err.message : "Unable to load this profile."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshUser]);

  const onFollow = useCallback(async () => {
    if (!user || user.isSelf || busy) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/login"); return; }
    setBusy(true);
    try {
      const response = await fetch(`${API}/users/${encodeURIComponent(user.id)}/follow`, { method: "POST", headers: authHeaders() });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not follow this account.");
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not follow this account.");
    } finally { setBusy(false); }
  }, [user, busy, refreshUser, router]);

  const onUnfollow = useCallback(async () => {
    if (!user || user.isSelf || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`${API}/users/${encodeURIComponent(user.id)}/follow`, { method: "DELETE", headers: authHeaders() });
      if (!response.ok) throw new Error("Could not update follow status.");
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update follow status.");
    } finally { setBusy(false); }
  }, [user, busy, refreshUser]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-12"><div className="animate-pulse rounded-3xl border bg-card p-8"><div className="flex items-center gap-5"><div className="h-24 w-24 rounded-full bg-muted"/><div className="flex-1 space-y-3"><div className="h-5 w-40 rounded bg-muted"/><div className="h-3 w-56 max-w-full rounded bg-muted"/></div></div></div></div>;
  if (error && !user) return <div className="mx-auto max-w-2xl px-4 py-16 text-center"><h1 className="text-xl font-semibold">Profile unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button className="mt-5 rounded-xl" onClick={() => router.refresh()}>Try again</Button></div>;
  if (!user) return null;

  const privateWall = user.accountType === "PRIVATE" && !user.isSelf && user.followStatus !== "FOLLOWING";
  const posts = viewMode === "list" ? user.postsList : user.postsGrid;

  return (
    <main className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-secondary to-primary/10 sm:h-32" />
        <div className="px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-12 flex flex-col items-center gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:gap-6">
            <Avatar className="h-24 w-24 border-4 border-card shadow-md sm:h-28 sm:w-28">
              <AvatarImage src={user.avatarUrl || "/placeholder-user.jpg"} alt={`${user.username}'s avatar`} />
              <AvatarFallback>{user.username[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:pb-1 sm:text-left">
              <div className="flex flex-col items-center gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{user.username}</h1>
                {user.accountType === "PRIVATE" && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium"><Lock className="h-3 w-3"/> Private</span>}
              </div>
              {user.name && <p className="mt-1 text-sm text-muted-foreground">{user.name}</p>}
            </div>
            {!user.isSelf && <div className="flex flex-wrap items-center justify-center gap-2 sm:pb-1">
              {user.followStatus === "FOLLOWING" ? <Button variant="outline" onClick={onUnfollow} disabled={busy} className="rounded-xl">Following</Button> : user.followStatus === "REQUESTED" ? <Button variant="outline" disabled className="rounded-xl">Request sent</Button> : <Button onClick={onFollow} disabled={busy} className="rounded-xl">{busy ? "Please wait…" : "Follow"}</Button>}
              <Button asChild variant="outline" className="rounded-xl"><Link href={`/inbox?user=${encodeURIComponent(user.id)}`}><MessageCircle className="mr-2 h-4 w-4"/> Message</Link></Button>
              <BlockButton targetId={user.id} onToggle={() => { void refreshUser(); }} />
            </div>}
            {user.isSelf && <Button asChild variant="outline" className="rounded-xl sm:mb-1"><Link href="/settings">Edit profile</Link></Button>}
          </div>

          <div className="mx-auto mt-6 max-w-2xl sm:mx-0">
            {user.bio ? <p className="whitespace-pre-wrap text-sm leading-6">{user.bio}</p> : <p className="text-sm text-muted-foreground">No bio added yet.</p>}
            <div className="mt-5 grid max-w-md grid-cols-3 divide-x rounded-2xl border border-border/70 bg-secondary/40 py-3">
              <div className="text-center"><p className="text-lg font-bold">{numberLabel(user.postCount || user.postsGrid.length)}</p><p className="text-xs text-muted-foreground sm:text-sm">Posts</p></div>
              <div className="text-center"><p className="text-lg font-bold">{numberLabel(user.followerCount)}</p><p className="text-xs text-muted-foreground sm:text-sm">Followers</p></div>
              <div className="text-center"><p className="text-lg font-bold">{numberLabel(user.followingCount)}</p><p className="text-xs text-muted-foreground sm:text-sm">Following</p></div>
            </div>
          </div>
        </div>
      </section>

      {error && <p role="status" className="mt-4 rounded-xl border border-destructive/20 bg-card px-4 py-3 text-sm text-destructive">{error}</p>}

      {privateWall ? <section className="mt-6 rounded-3xl border border-dashed bg-card px-6 py-14 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary"><Lock className="h-6 w-6 text-muted-foreground"/></div>
        <h2 className="mt-4 text-lg font-semibold">This account is private</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{user.followStatus === "REQUESTED" ? "Your follow request has been sent. Posts will appear here if it is approved." : "Follow this account to see their posts and updates."}</p>
      </section> : <section className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/80 pb-3">
          <div><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary"/><h2 className="text-lg font-semibold">Posts</h2></div><p className="mt-1 text-xs text-muted-foreground">A little collection of {user.username}’s moments</p></div>
          <div className="flex items-center gap-1 rounded-xl border bg-card p-1">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="rounded-lg" onClick={() => setViewMode("grid")} aria-label="Grid view"><Grid className="h-4 w-4"/></Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="rounded-lg" onClick={() => setViewMode("list")} aria-label="List view"><List className="h-4 w-4"/></Button>
          </div>
        </div>
        {posts.length === 0 ? <div className="rounded-2xl border border-dashed bg-card px-6 py-12 text-center"><p className="font-medium">Nothing posted yet</p><p className="mt-1 text-sm text-muted-foreground">When {user.username} shares something, it will show up here.</p></div> : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
            {posts.map((post) => <Link href={`/user/${encodeURIComponent(user.username)}`} key={post.id} className="group relative aspect-square overflow-hidden rounded-2xl border bg-secondary shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              {post.mediaUrl && post.postType === "VIDEO" ? <video src={post.mediaUrl} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" aria-label={post.caption || "Video post"}/> : post.mediaUrl && post.postType === "IMAGE" ? <Image src={post.mediaUrl} alt={post.caption || "Post media"} fill unoptimized className="object-cover transition duration-300 group-hover:scale-105"/> : <div className="flex h-full items-center justify-center p-4 sm:p-6"><p className="line-clamp-6 text-center text-sm leading-6">{post.caption || "A shared moment"}</p></div>}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 opacity-0 transition group-hover:opacity-100"><p className="line-clamp-2 text-xs font-medium text-white">{post.caption || "View post"}</p></div>
            </Link>)}
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => <Card key={post.id} className="overflow-hidden rounded-2xl border-border/70 shadow-sm"><CardContent className="p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">@{user.username}</span><span>·</span><time dateTime={post.postedAt}>{new Date(post.postedAt).toLocaleDateString()}</time></div>
              {post.caption && <p className="whitespace-pre-wrap break-words text-sm leading-6">{post.caption}</p>}
              {post.mediaUrl && post.postType !== "TEXT" && <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl bg-secondary">{post.postType === "VIDEO" ? <video src={post.mediaUrl} controls playsInline preload="metadata" className="h-full w-full object-contain" aria-label={post.caption || "Video post"}/> : <Image src={post.mediaUrl} alt={post.caption || "Post media"} fill unoptimized className="object-contain"/>}</div>}
            </CardContent></Card>)}
          </div>
        )}
      </section>}
    </main>
  );
}
