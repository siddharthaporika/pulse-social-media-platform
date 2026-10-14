// scripts/syncLikeCounts.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const main = async () => {
  const posts = await prisma.post.findMany({ select: { id: true } });
  for (const p of posts) {
    const c = await prisma.like.count({ where: { postId: p.id } });
    await prisma.post.update({ where: { id: p.id }, data: { likeCount: c } });
  }
  console.log("Synced likeCount for", posts.length, "posts");
};
main().finally(() => prisma.$disconnect());
