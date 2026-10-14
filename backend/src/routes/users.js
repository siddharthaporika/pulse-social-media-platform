// backend/src/routes/users.js
import express from "express";
import pkg from "@prisma/client";
import { authRequired } from "../middleware/auth.js";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function isEitherBlocked(aId, bId) {
  const block = await prisma.blocks.findFirst({
    where: {
      OR: [
        { blockerId: aId, blockedId: bId },
        { blockerId: bId, blockedId: aId },
      ],
    },
  });
  return !!block;
}


const router = express.Router();

/**
 * GET /users/by-username/:username
 * Public profile payload + viewer-aware flags + (optionally) posts
 */
router.get("/by-username/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const viewerId = req.user?.id || null;

    const u = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatarUrl: true,
        accountType: true,
        followerCount: true,
        followingCount: true,
        postCount: true,
      },
    });

    if (!u) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSelf = viewerId === u.id;

    // follow status from viewer -> profile owner
    let followStatus = "NONE";
    if (viewerId && !isSelf) {
      const follow = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: u.id,
          },
        },
      });

      if (follow) {
        followStatus = "FOLLOWING";
      } else {
        const fr = await prisma.followRequest.findUnique({
          where: {
            requesterId_targetId: {
              requesterId: viewerId,
              targetId: u.id,
            },
          },
        });
        if (fr && fr.status === "PENDING") {
          followStatus = "REQUESTED";
        }
      }
    }

    const isPrivate = u.accountType === "PRIVATE";
    const canViewPosts = !isPrivate || isSelf || followStatus === "FOLLOWING";

    let postsList = [];
    let postsGrid = [];

    // only attach posts when the viewer is allowed to see them
    if (canViewPosts) {
      const posts = await prisma.post.findMany({
        where: { userId: u.id },
        orderBy: { postedAt: "desc" },
        select: {
          id: true,
          caption: true,
          mediaUrl: true,
          postType: true,
          postedAt: true,
        },
      });

      postsList = posts.map((p) => ({
        id: p.id,
        caption: p.caption,
        mediaUrl: p.mediaUrl,
        postType: p.postType,
        postedAt: p.postedAt,
      }));
      postsGrid = postsList;
    }

    return res.json({
      id: u.id,
      username: u.username,
      name: u.name,
      bio: u.bio,
      avatarUrl: u.avatarUrl,
      followerCount: u.followerCount,
      followingCount: u.followingCount,
      postCount: u.postCount,
      accountType: u.accountType, // "PUBLIC" | "PRIVATE"
      isSelf,
      followStatus,               // "NONE" | "REQUESTED" | "FOLLOWING"
      postsList,
      postsGrid,
    });
  } catch (err) {
    console.error("by-username failed:", err);
    res.status(500).json({ message: "Failed to load profile" });
  }
});

/**
 * User's posts (privacy respected)
 * GET /users/:id/posts
 */
router.get("/:id/posts", async (req, res) => {
  try {
    const targetId = req.params.id;
    const viewerId = req.user?.id || null;

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { accountType: true },
    });
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    if (target.accountType === "PRIVATE" && viewerId !== targetId) {
      const follow = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId || "",
            followingId: targetId,
          },
        },
      });
      if (!follow) {
        return res.status(403).json({ message: "Private account" });
      }
    }

    const posts = await prisma.post.findMany({
      where: { userId: targetId },
      orderBy: { postedAt: "desc" },
      select: {
        id: true,
        caption: true,
        mediaUrl: true,
        postType: true,
        postedAt: true,
        likeCount: true,
        commentCount: true,
        author: { select: { username: true } },
      },
    });

    res.json(posts);
  } catch (err) {
    console.error("user posts failed:", err);
    res.status(500).json({ message: "Failed to load posts" });
  }
});

/**
 * Follow / Unfollow
 * POST   /users/:id/follow
 * DELETE /users/:id/follow
 * POST   /users/unfollow/:id  (legacy alias)
 */
router.post("/:id/follow", authRequired, async (req, res) => {
  try {
    const me = req.user.id;
    const targetId = req.params.id;

    if (me === targetId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    // NEW: block check
    if (await isEitherBlocked(me, targetId)) {
      return res.status(403).json({ message: "One of you has blocked the other" });
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { accountType: true },
    });
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    // already following?
    const already = await prisma.follows.findUnique({
      where: {
        followerId_followingId: { followerId: me, followingId: targetId },
      },
    });
    if (already) {
      return res.json({ status: "FOLLOWING" });
    }

    // PRIVATE account → only treat PENDING as "requested"
    if (target.accountType === "PRIVATE") {
      const existingReq = await prisma.followRequest.findUnique({
        where: { requesterId_targetId: { requesterId: me, targetId } },
      });

      if (existingReq && existingReq.status === "PENDING") {
        return res.json({ status: "REQUESTED" });
      }

      // If there was an old REJECTED/ACCEPTED row, clear it and create a fresh PENDING
      if (existingReq) {
        await prisma.followRequest.delete({
          where: { requesterId_targetId: { requesterId: me, targetId } },
        });
      }

      await prisma.followRequest.create({
        data: { requesterId: me, targetId, status: "PENDING" },
      });
      return res.json({ status: "REQUESTED" });
    }

    // PUBLIC account → follow immediately
    await prisma.follows.create({
      data: { followerId: me, followingId: targetId },
    });

    await prisma.user.update({
      where: { id: me },
      data: { followingCount: { increment: 1 } },
    }).catch(() => {});
    await prisma.user.update({
      where: { id: targetId },
      data: { followerCount: { increment: 1 } },
    }).catch(() => {});

    return res.json({ status: "FOLLOWING" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Follow failed" });
  }
});


router.delete("/:id/follow", authRequired, async (req, res) => {
  try {
    const me = req.user.id;
    const targetId = req.params.id;

    await prisma.$transaction([
      prisma.follows.deleteMany({
        where: { followerId: me, followingId: targetId },
      }),
      prisma.followRequest.deleteMany({
        where: { requesterId: me, targetId, status: "PENDING" },
      }),
      prisma.user.update({
        where: { id: me },
        data: { followingCount: { decrement: 1 } },
      }),
      prisma.user.update({
        where: { id: targetId },
        data: { followerCount: { decrement: 1 } },
      }),
    ]);

    return res.json({ status: "UNFOLLOWED" });
  } catch (err) {
    console.error("unfollow failed:", err);
    res.status(500).json({ message: "Unfollow failed" });
  }
});

// legacy alias used by some older frontend code
router.post("/unfollow/:id", authRequired, async (req, res) => {
  try {
    const me = req.user.id;
    const targetId = req.params.id;

    await prisma.$transaction([
      prisma.follows.deleteMany({
        where: { followerId: me, followingId: targetId },
      }),
      prisma.user.update({
        where: { id: me },
        data: { followingCount: { decrement: 1 } },
      }),
      prisma.user.update({
        where: { id: targetId },
        data: { followerCount: { decrement: 1 } },
      }),
    ]);

    return res.json({ status: "UNFOLLOWED" });
  } catch (err) {
    console.error("unfollow (legacy) failed:", err);
    res.status(500).json({ message: "Unfollow failed" });
  }
});

/**
 * Follow requests (for PRIVATE accounts)
 * GET  /users/me/follow-requests
 * POST /users/follow-requests/:requesterId/approve
 * POST /users/follow-requests/:requesterId/reject
 */
router.get("/me/follow-requests", authRequired, async (req, res) => {
  try {
    const me = req.user.id;

    const rows = await prisma.followRequest.findMany({
      where: { targetId: me, status: "PENDING" },
      include: {
        requester: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // frontend `InboxList` expects raw array with requester + createdAt
    res.json(rows);
  } catch (err) {
    console.error("follow-requests list failed:", err);
    res.status(500).json({ message: "Failed to load follow requests" });
  }
});

router.post(
  "/follow-requests/:requesterId/approve",
  authRequired,
  async (req, res) => {
    try {
      const me = req.user.id;
      const requesterId = req.params.requesterId;

      const fr = await prisma.followRequest.findUnique({
        where: {
          requesterId_targetId: {
            requesterId,
            targetId: me,
          },
        },
      });

      if (!fr || fr.status !== "PENDING") {
        return res.status(404).json({ message: "Follow request not found" });
      }

      await prisma.$transaction([
        prisma.followRequest.update({
          where: {
            requesterId_targetId: {
              requesterId,
              targetId: me,
            },
          },
          data: { status: "APPROVED" },
        }),
        prisma.follows.upsert({
          where: {
            followerId_followingId: {
              followerId: requesterId,
              followingId: me,
            },
          },
          update: {},
          create: { followerId: requesterId, followingId: me },
        }),
        prisma.user.update({
          where: { id: me },
          data: { followerCount: { increment: 1 } },
        }),
        prisma.user.update({
          where: { id: requesterId },
          data: { followingCount: { increment: 1 } },
        }),
      ]);

      res.json({ ok: true });
    } catch (err) {
      console.error("approve follow-request failed:", err);
      res.status(500).json({ message: "Approve failed" });
    }
  }
);

router.post(
  "/follow-requests/:requesterId/reject",
  authRequired,
  async (req, res) => {
    try {
      const me = req.user.id;
      const requesterId = req.params.requesterId;

      await prisma.followRequest.updateMany({
        where: {
          requesterId,
          targetId: me,
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      });

      res.json({ ok: true });
    } catch (err) {
      console.error("reject follow-request failed:", err);
      res.status(500).json({ message: "Reject failed" });
    }
  }
);

/**
 * Followers / Following lists (privacy respected)
 * GET /users/:id/followers
 * GET /users/:id/following
 */
router.get("/:id/followers", async (req, res) => {
  try {
    const targetId = req.params.id;
    const viewerId = req.user?.id || null;

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { accountType: true },
    });
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.accountType === "PRIVATE" && viewerId !== targetId) {
      const follow = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId || "",
            followingId: targetId,
          },
        },
      });
      if (!follow) {
        return res.status(403).json({ message: "Private account" });
      }
    }

    const rows = await prisma.follows.findMany({
      where: { followingId: targetId },
      include: {
        follower: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      rows.map((r) => ({
        id: r.follower.id,
        username: r.follower.username,
        avatarUrl: r.follower.avatarUrl || null,
      }))
    );
  } catch (err) {
    console.error("followers list failed:", err);
    res.status(500).json({ message: "Failed to load followers" });
  }
});

router.get("/:id/following", async (req, res) => {
  try {
    const targetId = req.params.id;
    const viewerId = req.user?.id || null;

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { accountType: true },
    });
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.accountType === "PRIVATE" && viewerId !== targetId) {
      const follow = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId || "",
            followingId: targetId,
          },
        },
      });
      if (!follow) {
        return res.status(403).json({ message: "Private account" });
      }
    }

    const rows = await prisma.follows.findMany({
      where: { followerId: targetId },
      include: {
        following: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      rows.map((r) => ({
        id: r.following.id,
        username: r.following.username,
        avatarUrl: r.following.avatarUrl || null,
      }))
    );
  } catch (err) {
    console.error("following list failed:", err);
    res.status(500).json({ message: "Failed to load following" });
  }
});

/**
 * SEARCH users
 * GET /users/search?query=<q>&limit=20&cursor=<userId>
 */
router.get("/search", async (req, res) => {
  try {
    const viewerId = req.user?.id || null;
    const q = String(req.query.q || req.query.query || "").trim();
    const take = Math.min(50, Number(req.query.limit) || 20);
    const cursorId = req.query.cursor ? String(req.query.cursor) : null;

    let where = {};
    if (q) {
      where = {
        OR: [
          { username: { contains: q } },
          { bio: { contains: q } },
        ],
      };
    }

    const rows = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        bio: true,
        accountType: true,
        followerCount: true,
        followingCount: true,
        createdAt: true,
        avatarUrl: true,
      },
      orderBy: q ? [{ username: "asc" }] : [{ createdAt: "desc" }],
      take: take + 1,
      ...(cursorId ? { skip: 1, cursor: { id: cursorId } } : {}),
    });

    const hasMore = rows.length > take;
    const page = rows.slice(0, take);

    let followingSet = new Set();
    if (viewerId && page.length) {
      const ids = page.map((r) => r.id);
      const follows = await prisma.follows.findMany({
        where: { followerId: viewerId, followingId: { in: ids } },
        select: { followingId: true },
      });
      followingSet = new Set(follows.map((f) => f.followingId));
    }

    const items = page.map((r) => ({
      id: r.id,
      username: r.username,
      bio: r.bio || "",
      avatar: r.avatarUrl || null,
      isPrivate: r.accountType === "PRIVATE",
      followers: r.followerCount || 0,
      following: r.followingCount || 0,
      isFollowing: viewerId ? followingSet.has(r.id) : false,
    }));

    res.json({
      items,
      nextCursor: hasMore ? rows[rows.length - 1].id : null,
    });
  } catch (err) {
    console.error("search failed:", err);
    res.status(500).json({ message: "Search failed" });
  }
});

/**
 * BLOCK / UNBLOCK
 * POST   /users/:id/block
 * DELETE /users/:id/block
 * GET    /users/me/blocked
 */
// POST /users/:id/block  -> block user
router.post("/:id/block", authRequired, async (req, res) => {
  try {
    const me = req.user.id;
    const targetId = String(req.params.id);

    if (me === targetId) {
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    // 1) Create or keep the block
    await prisma.blocks.upsert({
      where: { blockerId_blockedId: { blockerId: me, blockedId: targetId } },
      create: { blockerId: me, blockedId: targetId },
      update: {},
    });

    // 2) Kill all follow relations in BOTH directions
    await prisma.follows.deleteMany({
      where: {
        OR: [
          { followerId: me, followingId: targetId },
          { followerId: targetId, followingId: me },
        ],
      },
    });

    // 3) Kill all follow requests in BOTH directions (any status)
    await prisma.followRequest.deleteMany({
      where: {
        OR: [
          { requesterId: me, targetId },
          { requesterId: targetId, targetId: me },
        ],
      },
    });

    return res.json({ ok: true, status: "BLOCKED" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Block failed" });
  }
});


// DELETE /users/:id/block  -> unblock user
router.delete("/:id/block", authRequired, async (req, res) => {
  try {
    const me = req.user.id;
    const targetId = String(req.params.id);

    await prisma.blocks.deleteMany({
      where: { blockerId: me, blockedId: targetId },
    });

    return res.json({ ok: true, status: "UNBLOCKED" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unblock failed" });
  }
});


// GET /users/me/blocked  -> list people I blocked
router.get("/me/blocked", authRequired, async (req, res) => {
  try {
    const me = req.user.id;

    const rows = await prisma.blocks.findMany({
      where: { blockerId: me },
      include: {
        blocked: { select: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const items = rows.map(r => ({
      id: r.blocked.id,
      username: r.blocked.username,
      avatarUrl: r.blocked.avatarUrl || null,
      blockedAt: r.createdAt,
    }));

    // IMPORTANT: return the array, not { items }
    return res.json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load blocked users" });
  }
});




export default router;
