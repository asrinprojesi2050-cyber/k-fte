import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

export const providersRouter = Router();

providersRouter.get("/me", requireAuth, requireRole("provider"), async (req, res) => {
  const provider = await prisma.provider.findUnique({ where: { id: req.auth!.id } });
  res.json(provider);
});

const updateMeSchema = z.object({
  bio: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  photoUrl: z.string().optional(),
  idDocumentUrl: z.string().optional(),
  certificateUrl: z.string().optional(),
});

providersRouter.patch("/me", requireAuth, requireRole("provider"), async (req, res) => {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const provider = await prisma.provider.update({
    where: { id: req.auth!.id },
    data: parsed.data,
  });
  res.json(provider);
});

providersRouter.get("/:id", async (req, res) => {
  const provider = await prisma.provider.findUnique({
    where: { id: req.params.id },
    include: { 
      category: true, 
      reviews: { 
        orderBy: { createdAt: "desc" }, 
        take: 20,
        include: {
          customer: true,
          job: {
            include: {
              request: {
                include: { category: true }
              }
            }
          }
        }
      } 
    },
  });
  if (!provider) return res.status(404).json({ error: "Not found" });
  res.json(provider);
});
