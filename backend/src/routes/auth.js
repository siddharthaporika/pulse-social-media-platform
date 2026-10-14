import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { authRequired } from "../middleware/auth.js";
dotenv.config();

// import { PrismaClient } from "@prisma/client";

import pkg from "@prisma/client";

dotenv.config();

const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "login_signup"; // use env in prod

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { username, name, email, password, accountType, avatarUrl } = req.body;

    if (!username || !name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        name,
        email,
        passwordHashed: hashedpassword,
        accountType: accountType || "PUBLIC",
        avatarUrl: avatarUrl || null,
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!password || (!email && !username)) {
      return res
        .status(400)
        .json({ message: "Email or username and password are required" });
    }

    let user = null;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }
    if (!user && username) {
      user = await prisma.user.findUnique({ where: { username } });
    }

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHashed);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Get current user
router.get("/me", authRequired, async (req, res) => {
  try {
    const u = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        followerCount: true,
        followingCount: true,
        postCount: true,
        accountType: true,
        avatarUrl: true,
        email: true,
      },
    });

    if (!u) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(u);
  } catch (err) {
    console.error("/auth/me error:", err);
    res.status(500).json({ message: "Failed to load user" });
  }
});

export default router;
