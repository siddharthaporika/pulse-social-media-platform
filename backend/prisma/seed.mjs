import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("password123", 10);

  // Users
  const sarah = await prisma.user.upsert({
    where: { email: "sarah@example.com" },
    update: {},
    create: {
      username: "sarah_designs",
      name: "Sarah Designs",
      email: "sarah@example.com",
      passwordHashed: hashed,
      accountType: "PUBLIC",
    },
  });

  const john = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      username: "john_dev",
      name: "John Dev",
      email: "john@example.com",
      passwordHashed: hashed,
      accountType: "PUBLIC",
    },
  });

  // Posts (use images already in your frontend `/public` folder)
  await prisma.post.createMany({
    data: [
      {
        userId: sarah.id,
        postType: "IMAGE",
        caption: "Just finished a new project! Really excited about how it turned out.",
        mediaUrl: "/design-project-concept.png",
      },
      {
        userId: john.id,
        postType: "IMAGE",
        caption: "Exploring the mountains. Nature is the best therapy.",
        mediaUrl: "/majestic-mountain-vista.png",
      },
      {
        userId: sarah.id,
        postType: "IMAGE",
        caption: "Beautiful sunset today. Stop and appreciate the moment.",
        mediaUrl: "/sunset-landscape.jpg",
      },
    ],
  });

  console.log("✅ Seeded users and posts");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
