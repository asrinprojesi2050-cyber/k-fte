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
  currency: z.enum(["EUR", "MKD"]).optional(),
  photoUrls: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  targetProviderId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime().optional(),
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
    include: { customer: true }
  });

  // If a specific provider was targeted, notify them immediately
  if (parsed.data.targetProviderId) {
    const { sendToUser } = require("../services/push");
    sendToUser(
      parsed.data.targetProviderId, 
      "provider", 
      "Sana Özel Yeni İş İsteği!", 
      `${request.customer.name} sana doğrudan bir iş talebi gönderdi.`, 
      { requestId: request.id }
    );
  }

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

  const query = `
    SELECT * FROM (
      SELECT r.*,
        c.id as "c_id", c.slug as "c_slug", c."nameTr" as "c_nameTr", c."nameEn" as "c_nameEn", c."nameMk" as "c_nameMk", c."nameSq" as "c_nameSq",
        u.id as "u_id", u.name as "u_name",
        (6371 * acos(
          cos(radians(${provider.latitude})) * cos(radians(r.latitude)) * 
          cos(radians(r.longitude) - radians(${provider.longitude})) + 
          sin(radians(${provider.latitude})) * sin(radians(r.latitude))
        )) AS "distanceKm"
      FROM "requests" r
      LEFT JOIN "categories" c ON r."categoryId" = c.id
      LEFT JOIN "users" u ON r."customerId" = u.id
      WHERE r.status = 'OPEN' 
        AND r."categoryId" = '${provider.categoryId}'
        AND (r."targetProviderId" IS NULL OR r."targetProviderId" = '${provider.id}')
    ) as subquery
    WHERE "distanceKm" <= ${radiusKm}
    ORDER BY "createdAt" DESC;
  `;

  const rawRequests: any[] = await prisma.$queryRawUnsafe(query);

  const nearby = rawRequests.map((r) => {
    const category = r.c_id ? {
      id: r.c_id, slug: r.c_slug, nameTr: r.c_nameTr, nameEn: r.c_nameEn, nameMk: r.c_nameMk, nameSq: r.c_nameSq
    } : null;
    const customer = r.u_id ? { id: r.u_id, name: r.u_name } : null;
    
    delete r.c_id; delete r.c_slug; delete r.c_nameTr; delete r.c_nameEn; delete r.c_nameMk; delete r.c_nameSq;
    delete r.u_id; delete r.u_name;

    return { ...r, category, customer };
  });

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
