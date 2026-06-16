import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

export const customersRouter = Router();

customersRouter.get("/me", requireAuth, requireRole("customer"), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.id } });
  res.json(user);
});

const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  photoUrl: z.string().optional(),
});

customersRouter.patch("/me", requireAuth, requireRole("customer"), async (req, res) => {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await prisma.user.update({
    where: { id: req.auth!.id },
    data: parsed.data,
  });
  res.json(user);
});
