import express from "express";
import pkg from "@prisma/client";
import { authRequired } from "../middleware/auth.js";
import { broadcast } from "../realtime/hub.js";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const router = express.Router();

// GET /messages/conversations
router.get("/conversations", authRequired, async (req, res) => {
  const me = req.user.id;
  try {
    const rows = await prisma.message.findMany({
      where: { OR: [{ senderId: me }, { receiverId: me }] },
      orderBy: { sentAt: "desc" },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    const byPartner = new Map();

    for (const m of rows) {
      const isMeSender = m.senderId === me;
      const other = isMeSender ? m.receiver : m.sender;
      if (byPartner.has(other.id)) continue;

      byPartner.set(other.id, {
        partnerId: other.id,
        username: other.username,
        avatarUrl: other.avatarUrl,
        lastMessage:
          m.content ||
          (m.postId ? "Shared a post" : m.mediaUrl ? "Sent media" : ""),
        sentAt: m.sentAt,
      });
    }

    res.json(Array.from(byPartner.values()));
  } catch (err) {
    console.error("conversations failed:", err);
    res.status(500).json({ message: "Failed to load conversations" });
  }
});

// GET /messages/with/:partnerId
router.get("/with/:partnerId", authRequired, async (req, res) => {
  const me = req.user.id;
  const partnerId = req.params.partnerId;
  try {
    const rows = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: me, receiverId: partnerId },
          { senderId: partnerId, receiverId: me },
        ],
      },
      orderBy: { sentAt: "asc" },
      select: {
        id: true,
        content: true,
        mediaUrl: true,
        postId: true,
        senderId: true,
        sentAt: true,
      },
    });

    const mapped = rows.map((m) => ({
        id: m.id,
        text:
        m.content ||
        (m.postId ? "Shared a post" : m.mediaUrl ? "Sent media" : ""),
        sender: m.senderId === me ? "me" : "other",
        timestamp: formatMessageTime(m.sentAt),
    }));
;

    res.json(mapped);
  } catch (err) {
    console.error("thread failed:", err);
    res.status(500).json({ message: "Failed to load messages" });
  }
});

// POST /messages/send
// body: { to, content?, mediaUrl?, postId? }
router.post("/send", authRequired, async (req, res) => {
  const me = req.user.id;
  const { to, content, mediaUrl, postId } = req.body || {};

  if (!to) return res.status(400).json({ message: "Missing 'to'" });
  if (!content && !mediaUrl && !postId) {
    return res.status(400).json({ message: "Message is empty" });
  }

  try {
    const [msg, from, toUser] = await prisma.$transaction([
      prisma.message.create({
        data: {
          senderId: me,
          receiverId: to,
          content: content ?? null,
          mediaUrl: mediaUrl ?? null,
          postId: postId ?? null,
        },
      }),
      prisma.user.findUnique({
        where: { id: me },
        select: { id: true, username: true, avatarUrl: true },
      }),
      prisma.user.findUnique({
        where: { id: to },
        select: { id: true, username: true, avatarUrl: true },
      }),
    ]);

    broadcast("message_new", {
      id: msg.id,
      content: msg.content,
      mediaUrl: msg.mediaUrl,
      postId: msg.postId,
      fromUserId: from.id,
      toUserId: toUser?.id ?? to,
      fromUsername: from.username,
      toUsername: toUser?.username ?? "",
      fromAvatarUrl: from.avatarUrl,
      toAvatarUrl: toUser?.avatarUrl ?? null,
      sentAt: msg.sentAt,
    });

    res.status(201).json({
      id: msg.id,
      content: msg.content,
      sentAt: msg.sentAt,
      to: toUser?.id ?? to,
    });
  } catch (err) {
    console.error("send failed:", err);
    res.status(500).json({ message: "Send failed" });
  }
});

export default router;