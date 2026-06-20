import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db";

export type AuthRole = "customer" | "provider" | "admin";

export interface AuthPayload {
  id: string;
  role: AuthRole;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-production";

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    
    // Check if banned
    if (payload.role === "customer") {
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (user?.isBanned) return res.status(403).json({ error: "Hesabınız askıya alınmıştır." });
    } else if (payload.role === "provider") {
      const provider = await prisma.provider.findUnique({ where: { id: payload.id } });
      if (provider?.isBanned) return res.status(403).json({ error: "Hesabınız askıya alınmıştır." });
    } else if (payload.role === "admin") {
      // Admins are not banned
    }

    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(role: AuthRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.auth?.role !== role) {
      return res.status(403).json({ error: `Requires ${role} role` });
    }
    next();
  };
}
