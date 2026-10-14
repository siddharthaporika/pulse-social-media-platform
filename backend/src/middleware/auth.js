// src/middleware/auth.js
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt.js";

function extractToken(header) {
  if (!header) return null;
  return header.startsWith("Bearer ") ? header.slice(7) : header;
}

export function authOptional(req, _res, next) {
  const token = extractToken(req.headers.authorization);
  if (token) {
    try { req.user = { id: jwt.verify(token, JWT_SECRET).userId }; } catch { /* ignore */ }
  }
  next();
}

export function authRequired(req, res, next) {
  const raw = req.headers.authorization;
  const token = extractToken(raw);
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const d = jwt.verify(token, JWT_SECRET);
    req.user = { id: d.userId };
    next();
  } catch (e) {
    console.log("[authRequired] verify failed:", e.message);
    return res.status(401).json({ message: "Invalid token" });
  }
}
