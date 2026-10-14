"use client";

import { useState, useEffect, FormEvent } from "react";
import { Heart, MessageCircle, X, CornerDownRight, Share2, Send } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}
function buildAuthHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

interface AuthorLite {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  parentCommentId: string | null;
  author: AuthorLite;
  replies?: CommentItem[];
}

interface Post {
  id: string | number;
  username: string;
  avatar: string;
  content: string;
  image?: string;
  mediaType?: "IMAGE" | "VIDEO";
  likes: number;
  comments: number;
  timestamp: string;
  viewerLiked?: boolean;
}

interface Liker {
  id: string;
  username: string;
  avatarUrl?: string | null;
  isFollowing?: boolean;
  isSelf?: boolean;
}

interface PostCardProps {
  post: Post;
  cardId?: string;
}

export function PostCard({ post, cardId }: PostCardProps) {
  const postIdStr = String(post.id);

  // Likes
  const [isLiked, setIsLiked] = useState(!!post.viewerLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [pendingLike, setPendingLike] = useState(false);

  // Likers modal
  const [likersOpen, setLikersOpen] = useState(false);
  const [likersLoading, setLikersLoading] = useState(false);
  const [likers, setLikers] = useState<Liker[]>([]);

  // Comments
  const [commentCount, setCommentCount] = useState(post.comments);
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Share
  const [shareOpen, setShareOpen] = useState(false);
  const [shareQuery, setShareQuery] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareResults, setShareResults] = useState<AuthorLite[]>([]);
  const [shareSentTo, setShareSentTo] = useState<string | null>(null);
  const [shareError, setShareError] = useState("");

  // Keep local from props (when /posts or SSE updates)
  useEffect(() => {
    setIsLiked(!!post.viewerLiked);
    setLikeCount(post.likes);
    setCommentCount(post.comments);
  }, [post.viewerLiked, post.likes, post.comments]);

  // Like/unlike
 // LIKE / UNLIKE (FIXED)
const handleLike = async () => {
  if (!getToken()) {
    alert("Please login to like posts");
    return;
  }
  if (pendingLike) return;

  setPendingLike(true);

  try {
    const res = await fetch(`${API}/posts/${postIdStr}/like`, {
      method: isLiked ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
    });

    if (!res.ok) throw new Error("Like API failed");

    const data = await res.json();
    if (typeof data.likeCount === "number") setLikeCount(data.likeCount);
    if (typeof data.liked === "boolean") setIsLiked(data.liked);
  } catch (err) {
    console.error("Like failed", err);
  } finally {
    setPendingLike(false);
  }
};

  async function openLikers() {
    setLikersOpen(true);
    if (likers.length) return;
    setLikersLoading(true);
    try {
      const res = await fetch(`${API}/posts/${postIdStr}/likes`, { headers: buildAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const items: Liker[] = Array.isArray(data.items) ? data.items : [];
        items.sort(
          (a, b) =>
            Number(b.isSelf) - Number(a.isSelf) ||
            Number(b.isFollowing) - Number(a.isFollowing) ||
            a.username.localeCompare(b.username)
        );
        setLikers(items);
      } else {
        setLikers([]);
      }
    } catch {
      setLikers([]);
    } finally {
      setLikersLoading(false);
    }
  }

  async function followUser(userId: string) {
    try {
      await fetch(`${API}/users/${userId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      });
      setLikers((prev) => prev.map((u) => (u.id === userId ? { ...u, isFollowing: true } : u)));
    } catch {}
  }
  async function unfollowUser(userId: string) {
    try {
      let res = await fetch(`${API}/users/${userId}/follow`, { method: "DELETE", headers: { ...buildAuthHeaders() } });
      if (res.status === 404 || res.status === 405) {
        res = await fetch(`${API}/users/unfollow/${userId}`, { method: "POST", headers: { ...buildAuthHeaders() } });
      }
      setLikers((prev) => prev.map((u) => (u.id === userId ? { ...u, isFollowing: false } : u)));
    } catch {}
  }

  // Load comments (top-level + replies)
  async function loadComments() {
    setLoadingComments(true);
    try {
      const res = await fetch(`${API}/posts/${postIdStr}/comments`);
      const data = await res.json();
      const items: CommentItem[] = Array.isArray(data.items) ? data.items : [];
      const normalized = items.map((c) => ({
        ...c,
        parentCommentId: c.parentCommentId === null ? null : String(c.parentCommentId),
        replies: Array.isArray(c.replies)
          ? c.replies.map((r) => ({ ...r, parentCommentId: r.parentCommentId === null ? null : String(r.parentCommentId) }))
          : [],
      }));
      setComments(normalized);
    } catch (err) {
      console.error("Load comments failed", err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }

  const openComments = async () => {
    setShowComments(true);
    if (comments.length === 0) await loadComments();
  };

  // Add top-level comment
 // Add top-level comment (FIXED)
async function submitTopLevel(e: FormEvent) {
  e.preventDefault();
  const text = newComment.trim();
  if (!text) return;

  if (!getToken()) {
    alert("Please login to comment");
    return;
  }

  try {
    const res = await fetch(`${API}/posts/${postIdStr}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      body: JSON.stringify({ content: text }),
    });

    if (!res.ok) throw new Error("Add comment failed");

    // ❌ REMOVED (caused duplicates)
    // setComments((prev) => [...prev, top]);

    // SSE will insert the new comment automatically
    setNewComment("");
    setCommentCount((x) => x + 1);
  } catch (err) {
    console.error("Add comment failed", err);
  }
}

  // Add reply (1-tier)
  async function submitReply(e: FormEvent) {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || !replyFor) return;
    if (!getToken()) {
      alert("Please login to comment");
      return;
    }
    try {
      const res = await fetch(`${API}/posts/${postIdStr}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({ content: text, parentCommentId: replyFor }),
      });
      if (!res.ok) throw new Error("Add reply failed");
      const c: CommentItem = await res.json();
      const reply: CommentItem = { ...c, parentCommentId: c.parentCommentId ? String(c.parentCommentId) : null };

      setComments((prev) =>
        prev.map((top) => {
          if (String(top.id) !== String(reply.parentCommentId)) return top;
          const replies = top.replies ? [...top.replies] : [];
          if (replies.some((r) => String(r.id) === String(reply.id))) return top;
          return { ...top, replies: [...replies, reply] };
        })
      );

      setReplyText("");
      setReplyFor(null);
      setCommentCount((x) => x + 1);
    } catch (err) {
      console.error("Add reply failed", err);
    }
  }

  // LIVE comment updates while modal is open
  useEffect(() => {
    if (!showComments) return;
    if (typeof window === "undefined") return;

    const es = new EventSource(`${API}/events`);
    const handler = (evt: MessageEvent) => {
      try {
        const data = JSON.parse(evt.data);
        const { postId, commentCount: newCount, comment } = data;
        if (!postId || !comment) return;
        if (String(postId) !== postIdStr) return;

        if (typeof newCount === "number") setCommentCount(newCount);

        const c: CommentItem = { ...comment, parentCommentId: comment.parentCommentId ? String(comment.parentCommentId) : null };
        setComments((prev) => {
          if (prev.some((p) => String(p.id) === String(c.id)) || prev.some((p) => (p.replies || []).some((r) => String(r.id) === String(c.id)))) {
            return prev;
          }
          if (!c.parentCommentId) return [...prev, { ...c, replies: [] }];
          const parentIdStr = String(c.parentCommentId);
          return prev.map((top) => {
            if (String(top.id) !== parentIdStr) return top;
            const replies = top.replies ? [...top.replies] : [];
            return { ...top, replies: [...replies, c] };
          });
        });
      } catch (err) {
        console.error("PostCard post_comment_added parse error", err);
      }
    };

    es.addEventListener("post_comment_added", handler as any);
    es.onerror = (err) => console.error("PostCard SSE error", err);
    return () => {
      es.removeEventListener("post_comment_added", handler as any);
      es.close();
    };
  }, [showComments, postIdStr]);

  // ---- Share to DM ----
  useEffect(() => {
    const q = shareQuery.trim();
    if (!shareOpen || !q) { setShareResults([]); return; }
    const t = setTimeout(async () => {
      setShareLoading(true);
      setShareError("");
      try {
        const url = new URL(`${API}/users/search`);
        url.searchParams.set("limit", "10");
        url.searchParams.set("query", q);
        const res = await fetch(url.toString(), { headers: buildAuthHeaders() });
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        setShareResults(items.map((u: any) => ({ id: u.id, username: u.username, avatarUrl: u.avatar || null })));
      } catch {
        setShareResults([]);
        setShareError("Search failed");
      } finally {
        setShareLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [shareQuery, shareOpen]);

  async function sendShare(toUserId: string) {
    try {
      setShareError("");
      await fetch(`${API}/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({ to: toUserId, postId: postIdStr }),
      });
      setShareSentTo(toUserId);
    } catch {
      setShareError("Send failed");
    }
  }

  return (
    <Card id={cardId} className="overflow-hidden rounded-2xl border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-border/60 px-4 py-4 sm:px-5">
        <Avatar className="h-11 w-11 ring-2 ring-background">
          <AvatarImage src={post.avatar || "/placeholder.svg"} alt={post.username} />
          <AvatarFallback>{post.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col">
          <Link href={`/user/${post.username}`} className="text-sm font-semibold leading-none hover:underline">
            {post.username}
          </Link>
          <p className="text-xs text-muted-foreground">{post.timestamp}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 py-4 sm:px-5">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {post.content}
        </p>

        {post.image && (
          <div className="w-full overflow-hidden rounded-xl border bg-black/5">
            {post.mediaType === "VIDEO" ? (
              <video
                src={post.image}
                controls
                playsInline
                preload="metadata"
                className="mx-auto block max-h-[70vh] w-full object-contain"
                aria-label={`Video post by ${post.username}`}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.image}
                alt={`Post shared by ${post.username}`}
                loading="lazy"
                className="mx-auto block max-h-[70vh] max-w-full transition-transform duration-300"
                style={{ objectFit: "contain", objectPosition: "center", width: "100%", height: "auto", display: "block" }}
              />
            )}
          </div>
        )}
      </CardContent>


      <CardFooter className="flex items-center gap-2 border-t border-border/60 px-3 py-3 sm:gap-4 sm:px-4">
        <Button variant="ghost" size="sm" className={cn("gap-2", isLiked && "text-red-500")} onClick={handleLike} disabled={pendingLike}>
          <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
          {/* click the count to open likers list */}
          <span
            className="text-sm underline-offset-4 hover:underline"
            onClick={(e) => { e.stopPropagation(); openLikers(); }}
          >
            {likeCount}
          </span>
        </Button>

        <Button variant="ghost" size="sm" className="gap-2" onClick={openComments}>
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm">{commentCount}</span>
        </Button>

        <Button variant="ghost" size="sm" className="ml-auto gap-2" onClick={() => { setShareOpen(true); setShareSentTo(null); }}>
          <Share2 className="h-5 w-5" />
          Share
        </Button>
      </CardFooter>

      {/* LIKERS MODAL */}
      {likersOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
          <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-t-2xl bg-card shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="font-semibold">Liked by</div>
              <Button variant="ghost" size="icon" onClick={() => setLikersOpen(false)} aria-label="Close"><X className="h-5 w-5" /></Button>
            </div>
            <div className="h-[60vh] overflow-y-auto p-2">
              {likersLoading ? (
                <div className="p-4 text-sm text-muted-foreground">Loading…</div>
              ) : likers.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No likes yet</div>
              ) : (
                likers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-3 rounded-md p-3 hover:bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatarUrl || "/placeholder.svg"} />
                        <AvatarFallback>{u.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <Link href={`/user/${u.username}`} className="font-medium hover:underline">{u.username}</Link>
                        {u.isSelf ? <div className="text-xs text-muted-foreground">You</div> : null}
                      </div>
                    </div>
                    {!u.isSelf && (u.isFollowing
                      ? <Button size="sm" variant="outline" onClick={() => unfollowUser(u.id)}>Following</Button>
                      : <Button size="sm" onClick={() => followUser(u.id)}>Follow</Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS MODAL (with avatars) */}
      {showComments && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
          <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-card shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="font-semibold">Comments</div>
              <Button variant="ghost" size="icon" onClick={() => setShowComments(false)} aria-label="Close"><X className="h-5 w-5" /></Button>
            </div>

            <div className="h-[50vh] space-y-4 overflow-y-auto p-4 sm:h-[60vh]">
              {loadingComments ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-muted-foreground">Be the first to comment</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="space-y-2">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.author.avatarUrl || "/placeholder.svg"} />
                        <AvatarFallback>{c.author.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm">
                          <Link href={`/user/${c.author.username}`} className="font-medium hover:underline">{c.author.username}</Link>{" "}
                          <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="break-words text-sm leading-relaxed">{c.content}</div>
                        <div className="mt-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setReplyFor(String(c.id)); setReplyText(""); }}>
                            <CornerDownRight className="mr-1 h-4 w-4" /> Reply
                          </Button>
                        </div>

                        {(c.replies || []).map((r) => (
                          <div key={r.id} className="mt-3 flex gap-3 border-l pl-3">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={r.author.avatarUrl || "/placeholder.svg"} />
                              <AvatarFallback>{r.author.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs">
                                <Link href={`/user/${r.author.username}`} className="font-medium hover:underline">{r.author.username}</Link>{" "}
                                <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                              </div>
                              <div className="break-words text-sm leading-relaxed">{r.content}</div>
                            </div>
                          </div>
                        ))}

                        {replyFor === String(c.id) && (
                          <form onSubmit={submitReply} className="mt-2 flex items-center gap-2">
                            <Input placeholder={`Reply to ${c.author.username}…`} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                            <Button type="submit" size="sm">Reply</Button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={submitTopLevel} className="flex items-center gap-2 border-t p-3">
              <Input placeholder="Write a comment…" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
              <Button type="submit">Post</Button>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {shareOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
          <div className="w-full max-w-md overflow-hidden rounded-t-2xl bg-card shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="font-semibold">Share post</div>
              <Button variant="ghost" size="icon" onClick={() => setShareOpen(false)} aria-label="Close"><X className="h-5 w-5" /></Button>
            </div>
            <div className="space-y-3 p-4">
              <Input placeholder="Search username…" value={shareQuery} onChange={(e) => setShareQuery(e.target.value)} />
              {shareLoading ? (
                <div className="text-sm text-muted-foreground">Searching…</div>
              ) : shareError ? (
                <div className="text-sm text-destructive">{shareError}</div>
              ) : shareResults.length === 0 ? (
                <div className="text-sm text-muted-foreground">Type a username to find someone</div>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {shareResults.map((u) => {
                    const sent = shareSentTo === u.id;
                    return (
                      <div key={u.id} className="flex items-center justify-between gap-3 rounded-md p-2 hover:bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={u.avatarUrl || "/placeholder.svg"} />
                            <AvatarFallback>{u.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                          <Link href={`/user/${u.username}`} className="text-sm font-medium hover:underline">{u.username}</Link>
                        </div>
                        {sent ? (
                          <Link href={`/inbox?user=${u.id}`} className="text-xs text-primary underline underline-offset-4">Open chat</Link>
                        ) : (
                          <Button size="sm" className="gap-2" onClick={() => sendShare(u.id)}>
                            <Send className="h-4 w-4" /> Send
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default PostCard;