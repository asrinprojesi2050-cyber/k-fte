import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

export const pushRouter = Router();

const registerSchema = z.object({
  token: z.string().min(1),
});

pushRouter.post("/register", requireAuth, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await prisma.pushToken.findUnique({ where: { token: parsed.data.token } });
  if (existing) return res.json({ ok: true });

  await prisma.pushToken.create({
    data: { userId: req.auth!.id, role: req.auth!.role, token: parsed.data.token },
  });

  res.json({ ok: true });
});

pushRouter.delete("/unregister", requireAuth, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  await prisma.pushToken.deleteMany({ where: { token: parsed.data.token } });
  res.json({ ok: true });
});
