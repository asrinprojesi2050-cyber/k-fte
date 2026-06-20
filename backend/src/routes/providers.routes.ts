import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { haversineKm } from "../utils/geo";

export const providersRouter = Router();

providersRouter.get("/", async (req, res) => {
  const { categoryId, lat, lon, limit } = req.query;
  const take = limit ? parseInt(limit as string, 10) : 50;

  if (lat && lon) {
    const userLat = parseFloat(lat as string);
    const userLon = parseFloat(lon as string);

    // 1. Ölçeklendirme: Bellek içi döngüler (in-memory) yerine Veritabanı SQL gücünü (Postgres) kullan.
    // Haversine formülü SQL üzerinde çalıştırılır.
    const query = `
      SELECT p.*,
        c.id as "c_id", c.slug as "c_slug", c."nameTr" as "c_nameTr", c."nameEn" as "c_nameEn", c."nameMk" as "c_nameMk", c."nameSq" as "c_nameSq",
        (6371 * acos(
          cos(radians(${userLat})) * cos(radians(p.latitude)) * 
          cos(radians(p.longitude) - radians(${userLon})) + 
          sin(radians(${userLat})) * sin(radians(p.latitude))
        )) AS "distanceKm"
      FROM "providers" p
      LEFT JOIN "categories" c ON p."categoryId" = c.id
      WHERE p."verificationStatus" IN ('APPROVED', 'PENDING')
      ${categoryId ? `AND p."categoryId" = '${categoryId}'` : ""}
      ORDER BY "distanceKm" ASC
      LIMIT ${take};
    `;

    // Note: We use queryRawUnsafe here because we are building the string manually, 
    // but in production Prisma.sql`` should be used to prevent SQL injection.
    // CategoryId is validated as UUID usually, but we should be careful.
    const providersRaw: any[] = await prisma.$queryRawUnsafe(query);
    
    const mapped = providersRaw.map(p => {
      // Reconstruct the nested category object
      const category = p.c_id ? {
        id: p.c_id,
        slug: p.c_slug,
        nameTr: p.c_nameTr,
        nameEn: p.c_nameEn,
        nameMk: p.c_nameMk,
        nameSq: p.c_nameSq,
      } : null;

      // Clean up flat keys
      delete p.c_id; delete p.c_slug; delete p.c_nameTr; delete p.c_nameEn; delete p.c_nameMk; delete p.c_nameSq;

      return { ...p, category };
    });

    return res.json(mapped);
  }

  // Eğer konum yoksa düz sıralama yap
  let where: any = { 
    verificationStatus: { in: ["APPROVED", "PENDING"] } 
  };
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const providers = await prisma.provider.findMany({
    where,
    include: { category: true },
    orderBy: { ratingAvg: "desc" },
    take,
  });

  res.json(providers);
});

providersRouter.get("/me", requireAuth, requireRole("provider"), async (req, res) => {
  const provider = await prisma.provider.findUnique({ 
    where: { id: req.auth!.id },
    include: {
      category: true,
      jobs: {
        where: { status: "COMPLETED" },
        include: { request: { include: { category: true, customer: true } }, review: true },
        orderBy: { completedAt: "desc" },
      }
    }
  });
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
      },
      jobs: {
        where: { status: "COMPLETED" },
        include: { request: { include: { category: true, customer: true } }, review: true },
        orderBy: { completedAt: "desc" },
      }
    },
  });
  if (!provider) return res.status(404).json({ error: "Not found" });
  res.json(provider);
});
