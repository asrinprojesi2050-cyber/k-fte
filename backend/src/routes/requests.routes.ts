import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { haversineKm } from "../utils/geo";

export const requestsRouter = Router();

const createRequestSchema = z.object({
  categoryId: z.string().uuid(),
  description: z.string().min(5),
  budget: z.number().positive().optional(),
  photoUrls: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
});

requestsRouter.post("/", requireAuth, requireRole("customer"), async (req, res) => {
  const parsed = createRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const request = await prisma.request.create({
    data: {
      ...parsed.data,
      latitude: parsed.data.latitude ?? 42.0,
      longitude: parsed.data.longitude ?? 21.43,
      customerId: req.auth!.id,
    },
  });
  res.status(201).json(request);
});

requestsRouter.get("/mine", requireAuth, requireRole("customer"), async (req, res) => {
  const requests = await prisma.request.findMany({
    where: { customerId: req.auth!.id },
    include: { offers: true, category: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(requests);
});

// Open requests near the authenticated provider, in their category.
requestsRouter.get("/nearby", requireAuth, requireRole("provider"), async (req, res) => {
  const provider = await prisma.provider.findUnique({ where: { id: req.auth!.id } });
  if (!provider?.latitude || !provider?.longitude) {
    return res.status(400).json({ error: "Provider location not set" });
  }

  const radiusKm = Number(req.query.radiusKm ?? 15);
  const candidates = await prisma.request.findMany({
    where: { status: "OPEN", categoryId: provider.categoryId },
    include: { category: true, customer: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const nearby = candidates
    .filter(
      (r) => haversineKm(provider.latitude!, provider.longitude!, r.latitude, r.longitude) <= radiusKm
    )
    .map((r) => ({
      ...r,
      distanceKm: haversineKm(provider.latitude!, provider.longitude!, r.latitude, r.longitude),
    }));

  res.json(nearby);
});

requestsRouter.get("/:id", requireAuth, async (req, res) => {
  const request = await prisma.request.findUnique({
    where: { id: req.params.id },
    include: {
      offers: { include: { provider: true, job: { include: { review: true } } } },
      category: true,
    },
  });
  if (!request) return res.status(404).json({ error: "Not found" });
  res.json(request);
});

requestsRouter.post("/:id/cancel", requireAuth, requireRole("customer"), async (req, res) => {
  const request = await prisma.request.findUnique({ where: { id: req.params.id } });
  if (!request || request.customerId !== req.auth!.id) {
    return res.status(404).json({ error: "Not found" });
  }

  const updated = await prisma.request.update({
    where: { id: request.id },
    data: { status: "CANCELLED" },
  });
  res.json(updated);
});
