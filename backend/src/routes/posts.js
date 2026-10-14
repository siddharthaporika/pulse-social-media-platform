import express from "express";
import { PrismaClient } from "@prisma/client";
import { authRequired } from "../middleware/auth.js";
import { broadcast } from "../realtime/hub.js";

const router = express.Router();
const prisma = new PrismaClient();

async function markViewerLiked(viewerId, posts) {
  if (!viewerId || posts.length === 0) return new Set();
  const ids = posts.map((post) => post.id);
  const liked = await prisma.like.findMany({
    where: { userId: viewerId, postId: { in: ids } },
    select: { postId: true },
  });
  return new Set(liked.map((item) => item.postId));
}

// Create a post for the authenticated user and keep the profile count in sync.
router.post("/create", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const caption = String(req.body?.caption || "").trim();
    const mediaUrl = req.body?.mediaUrl ? String(req.body.mediaUrl) : null;
    const postType = req.body?.postType;

    if (!["TEXT", "IMAGE", "VIDEO"].includes(postType)) {
      return res.status(400).json({ message: "postType must be TEXT, IMAGE, or VIDEO" });
    }
    if (!caption && !mediaUrl) {
      return res.status(400).json({ message: "Add text or media before posting" });
    }

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: { userId, caption, mediaUrl, postType },
      });
      await tx.user.update({ where: { id: userId }, data: { postCount: { increment: 1 } } });
      return created;
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("Create post failed:", err);
    res.status(500).json({ message: "Could not create post" });
  }
});

// Feed, with viewer-specific like state when a valid token is present.
router.get("/", async (req, res) => {
  try {
    const rows = await prisma.post.findMany({
      where: { isHidden: false },
      orderBy: { postedAt: "desc" },
      select: {
        id: true,
        caption: true,
        mediaUrl: true,
        postType: true,
        postedAt: true,
        likeCount: true,
        commentCount: true,
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
    const likedSet = await markViewerLiked(req.user?.id || null, rows);
    res.json(rows.map((post) => ({ ...post, viewerLiked: likedSet.has(post.id) })));
  } catch (err) {
    console.error("Load feed failed:", err);
    res.status(500).json({ message: "Could not load posts" });
  }
});

// Posts by user ID. IDs are Prisma cuid strings, not numeric IDs.
router.get("/user/:id", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { userId: req.params.id, isHidden: false },
      orderBy: { postedAt: "desc" },
    });
    res.json(posts);
  } catch (err) {
    console.error("Load user posts failed:", err);
    res.status(500).json({ message: "Could not load user posts" });
  }
});

// Explore only includes posts from public accounts.
router.get("/explore", async (req, res) => {
  try {
    const take = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
    const cursorId = req.query.cursor ? String(req.query.cursor) : null;
    const rows = await prisma.post.findMany({
      where: { isHidden: false, author: { accountType: "PUBLIC" } },
      orderBy: { postedAt: "desc" },
      take: take + 1,
      ...(cursorId ? { skip: 1, cursor: { id: cursorId } } : {}),
      select: {
        id: true,
        caption: true,
        mediaUrl: true,
        postType: true,
        postedAt: true,
        likeCount: true,
        commentCount: true,
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
    const likedSet = await markViewerLiked(req.user?.id || null, rows);
    const hasMore = rows.length > take;
    const items = rows.slice(0, take).map((post) => ({
      ...post,
      caption: post.caption || "",
      viewerLiked: likedSet.has(post.id),
    }));
    res.json({ items, nextCursor: hasMore ? rows[take - 1].id : null });
  } catch (err) {
    console.error("Explore feed failed:", err);
    res.status(500).json({ message: "Explore feed failed" });
  }
});

router.post("/:id/like", authRequired, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  try {
    await prisma.$transaction(async (tx) => {
      try {
        await tx.like.create({ data: { postId, userId } });
        await tx.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });
      } catch (err) {
        if (err?.code !== "P2002") throw err;
      }
    });
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { likeCount: true } });
    if (!post) return res.status(404).json({ message: "Post not found" });
    broadcast("post_like_updated", { postId, likeCount: post.likeCount });
    res.json({ liked: true, likeCount: post.likeCount });
  } catch (err) {
    console.error("Like failed:", err);
    res.status(500).json({ message: "Like failed" });
  }
});

router.delete("/:id/like", authRequired, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  try {
    await prisma.$transaction(async (tx) => {
      const deleted = await tx.like.deleteMany({ where: { userId, postId } });
      if (deleted.count > 0) {
        await tx.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
      }
    });
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { likeCount: true } });
    if (!post) return res.status(404).json({ message: "Post not found" });
    broadcast("post_like_updated", { postId, likeCount: post.likeCount });
    res.json({ liked: false, likeCount: post.likeCount });
  } catch (err) {
    console.error("Unlike failed:", err);
    res.status(500).json({ message: "Unlike failed" });
  }
});

router.get("/:id/likes", async (req, res) => {
  try {
    const postId = String(req.params.id);
    const viewerId = req.user?.id || null;
    const rows = await prisma.like.findMany({
      where: { postId },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    let followingSet = new Set();
    if (viewerId) {
      const ids = rows.map((row) => row.user.id).filter((id) => id !== viewerId);
      if (ids.length) {
        const follows = await prisma.follows.findMany({
          where: { followerId: viewerId, followingId: { in: ids } },
          select: { followingId: true },
        });
        followingSet = new Set(follows.map((item) => item.followingId));
      }
    }
    res.json({ items: rows.map((row) => ({
      id: row.user.id,
      username: row.user.username,
      avatarUrl: row.user.avatarUrl || null,
      isFollowing: viewerId ? followingSet.has(row.user.id) : false,
      isSelf: viewerId === row.user.id,
    })) });
  } catch (err) {
    console.error("Load likes failed:", err);
    res.status(500).json({ message: "Failed to load likes" });
  }
});

router.get("/:id/comments", async (req, res) => {
  try {
    const postId = req.params.id;
    const take = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
    const cursor = req.query.cursor ? String(req.query.cursor) : null;
    const items = await prisma.comment.findMany({
      where: { postId, parentCommentId: null },
      orderBy: { createdAt: "asc" },
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true, content: true, createdAt: true, parentCommentId: true,
        author: { select: { id: true, username: true, avatarUrl: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true, content: true, createdAt: true, parentCommentId: true,
            author: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });
    const hasMore = items.length > take;
    res.json({ items: items.slice(0, take), nextCursor: hasMore ? items[take - 1].id : null });
  } catch (err) {
    console.error("Load comments failed:", err);
    res.status(500).json({ message: "Load comments failed" });
  }
});

router.post("/:id/comments", authRequired, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const content = String(req.body?.content || "").trim();
    const parentCommentId = req.body?.parentCommentId ? String(req.body.parentCommentId) : null;
    if (!content) return res.status(400).json({ message: "Empty comment" });

    if (parentCommentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentCommentId },
        select: { id: true, postId: true, parentCommentId: true },
      });
      if (!parent || parent.postId !== postId || parent.parentCommentId) {
        return res.status(400).json({ message: "Replies must target a top-level comment on this post" });
      }
    }

    const [comment] = await prisma.$transaction([
      prisma.comment.create({ data: { postId, userId, content, parentCommentId } }),
      prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
    ]);
    const withAuthor = await prisma.comment.findUnique({
      where: { id: comment.id },
      select: {
        id: true, content: true, createdAt: true, parentCommentId: true,
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { commentCount: true } });
    broadcast("post_comment_added", { postId, commentCount: post?.commentCount ?? 0, comment: withAuthor });
    res.status(201).json(withAuthor);
  } catch (err) {
    console.error("Add comment failed:", err);
    res.status(500).json({ message: "Add comment failed" });
  }
});

export default router;
