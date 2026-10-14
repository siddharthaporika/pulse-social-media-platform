"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PostCard } from "@/components/post-card";

type UserHit = {
  id: string;
  username: string;
  avatar?: string | null;
  bio?: string;
  isPrivate: boolean;
  followers: number;
  following: number;
  isFollowing?: boolean;
};

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
const nf = new Intl.NumberFormat();

function buildAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setDebounced(value), delay);
    return () => { if (tRef.current) clearTimeout(tRef.current); };
  }, [value, delay]);
  return debounced;
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleString();
}

export function ExploreFeed() {
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);
  const usersMode = debouncedQ.trim().length >= 2;

  // users
  const [users, setUsers] = useState<UserHit[]>([]);
  const [usersNext, setUsersNext] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  // posts
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postsNext, setPostsNext] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // ---------- LOAD USERS ----------
  useEffect(() => {
    if (!usersMode) return;

    let aborted = false;
    (async () => {
      setLoading(true);
      try {
        const url = new URL(`${API}/users/search`);
        url.searchParams.set("limit", "20");
        url.searchParams.set("query", debouncedQ.trim());
        const res = await fetch(url.toString(), { headers: buildAuthHeaders() });
        if (!res.ok) { setUsers([]); setUsersNext(null); return; }
        const data = await res.json();
        if (aborted) return;
        setUsers(data.items || []);
        setUsersNext(data.nextCursor ?? null);
      } finally { if (!aborted) setLoading(false); }
    })();

    return () => { aborted = true; };
  }, [usersMode, debouncedQ]);

  async function loadMoreUsers() {
    if (!usersMode || !usersNext || loading) return;
    setLoading(true);
    try {
      const url = new URL(`${API}/users/search`);
      url.searchParams.set("limit", "20");
      url.searchParams.set("query", debouncedQ.trim());
      url.searchParams.set("cursor", usersNext);
      const res = await fetch(url.toString(), { headers: buildAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setUsers((p) => [...p, ...(data.items || [])]);
      setUsersNext(data.nextCursor ?? null);
    } finally { setLoading(false); }
  }

  async function follow(userId: string) {
    if (busyIds.has(userId)) return;
    const next = new Set(busyIds); next.add(userId); setBusyIds(next);
    try {
      const res = await fetch(`${API}/users/${userId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (data?.status === "REQUESTED") {
        setRequestedIds((s) => new Set([...s, userId]));
      } else {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isFollowing: true, followers: (u.followers ?? 0) + 1 } : u)));
      }
    } finally { const n = new Set(busyIds); n.delete(userId); setBusyIds(n); }
  }
  async function cancelRequest(userId: string) {
    if (busyIds.has(userId)) return;
    const next = new Set(busyIds); next.add(userId); setBusyIds(next);
    try {
      await fetch(`${API}/users/${userId}/follow-request`, { method: "DELETE", headers: { ...buildAuthHeaders() } });
      setRequestedIds((s) => { const c = new Set(s); c.delete(userId); return c; });
    } finally { const n = new Set(busyIds); n.delete(userId); setBusyIds(n); }
  }
  async function unfollow(userId: string) {
    if (busyIds.has(userId)) return;
    const next = new Set(busyIds); next.add(userId); setBusyIds(next);
    try {
      let res = await fetch(`${API}/users/${userId}/follow`, { method: "DELETE", headers: { ...buildAuthHeaders() } });
      if (res.status === 404 || res.status === 405) {
        res = await fetch(`${API}/users/unfollow/${userId}`, { method: "POST", headers: { ...buildAuthHeaders() } });
      }
      if (!res.ok) return;
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isFollowing: false, followers: Math.max(0, (u.followers ?? 0) - 1) } : u)));
    } finally { const n = new Set(busyIds); n.delete(userId); setBusyIds(n); }
  }

  // ---------- LOAD POSTS (explore feed) ----------
  useEffect(() => {
    if (usersMode) return;
    let aborted = false;
    (async () => {
      setLoading(true);
      try {
        const url = new URL(`${API}/posts/explore`);
        url.searchParams.set("limit", "15");
        const res = await fetch(url.toString(), { headers: buildAuthHeaders() });
        if (!res.ok) { setPosts([]); setPostsNext(null); return; }
        const data = await res.json();
        if (aborted) return;
        setPosts((data.items || []) as FeedPost[]);
        setPostsNext(data.nextCursor ?? null);
      } finally { if (!aborted) setLoading(false); }
    })();
    return () => { aborted = true; };
  }, [usersMode]);

  async function loadMorePosts() {
    if (usersMode || !postsNext || loading) return;
    setLoading(true);
    try {
      const url = new URL(`${API}/posts/explore`);
      url.searchParams.set("limit", "15");
      url.searchParams.set("cursor", postsNext);
      const res = await fetch(url.toString(), { headers: buildAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setPosts((p) => [...p, ...(data.items || [])]);
      setPostsNext(data.nextCursor ?? null);
    } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" />
        {!usersMode && <p className="mt-1 text-xs text-muted-foreground">Tip: type at least 2 characters to search people.</p>}
      </div>

      {/* USERS MODE */}
      {usersMode ? (
        <>
          {loading && users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Searching…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {users.map((u) => {
                const requested = requestedIds.has(u.id);
                return (
                  <Card key={u.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={u.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{u.username?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link href={`/user/${encodeURIComponent(u.username)}`} className="truncate font-medium hover:underline">
                              {u.username}
                            </Link>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {nf.format(u.followers)} followers · {nf.format(u.following)} following
                          </div>
                          {u.bio ? <div className="mt-1 line-clamp-2 text-sm">{u.bio}</div> : null}
                        </div>

                        {u.isFollowing ? (
                          <Button size="sm" variant="outline" disabled={busyIds.has(u.id)} onClick={() => unfollow(u.id)}>Following</Button>
                        ) : requested ? (
                          <Button size="sm" variant="outline" disabled={busyIds.has(u.id)} onClick={() => cancelRequest(u.id)}>Requested</Button>
                        ) : (
                          <Button size="sm" disabled={busyIds.has(u.id)} onClick={() => follow(u.id)}>Follow</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          <div className="mt-4 flex justify-center">
            {usersNext ? <Button onClick={loadMoreUsers} disabled={loading} variant="secondary">{loading ? "Loading…" : "Load more"}</Button> : null}
          </div>
        </>
      ) : (
        // POSTS MODE — uniform PostCard (no black bars / no broken icon for TEXT)
        <>
          {loading && posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading feed…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts yet.</p>
          ) : (
            <div className="space-y-5">
              {posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={{
                    id: p.id,
                    username: p.author.username,
                    avatar: p.author.avatarUrl || "/placeholder.svg",
                    content: p.caption || "",
                    image: p.postType === "IMAGE" ? p.mediaUrl ?? undefined : undefined,
                    likes: p.likeCount ?? 0,
                    comments: p.commentCount ?? 0,
                    timestamp: timeAgo(p.postedAt),
                    viewerLiked: !!p.viewerLiked,
                  }}
                />
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-center">
            {postsNext ? <Button onClick={loadMorePosts} disabled={loading} variant="secondary">{loading ? "Loading…" : "Load more"}</Button> : null}
          </div>
        </>
      )}
    </div>
  );
}

export default ExploreFeed;