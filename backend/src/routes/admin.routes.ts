import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { sendToUser } from "../services/push";

export const adminRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-kofte-key";

// Admin requires "admin" role. Let's create a custom middleware since the normal auth doesn't handle "admin" natively yet.
// Wait, requireAuth decodes JWT and sets req.auth.
// If we issue a token with role: "admin", requireAuth will pass, and we can check req.auth.role === "admin".

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.auth?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

adminRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const admin = await prisma.admin.findUnique({ where: { email: parsed.data.email } });
  if (!admin) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(parsed.data.password, admin.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: admin.id, phone: admin.email, role: "admin" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email } });
});

// Admin routes below
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/stats", async (req, res) => {
  const usersCount = await prisma.user.count();
  const providersCount = await prisma.provider.count();
  
  // Total requests to calculate match rate
  const totalRequestsCount = await prisma.request.count();
  const activeRequestsCount = await prisma.request.count({ where: { status: "OPEN" } });
  
  // Get all completed jobs to calculate volumes
  const completedJobs = await prisma.job.findMany({ 
    where: { status: "COMPLETED" }, 
    select: { finalPrice: true, currency: true, completedAt: true } 
  });
  
  const volumeEur = completedJobs.filter(j => j.currency === "EUR").reduce((sum, j) => sum + j.finalPrice, 0);
  const volumeMkd = completedJobs.filter(j => j.currency === "MKD").reduce((sum, j) => sum + j.finalPrice, 0);
  const completedJobsCount = completedJobs.length;

  // KPIs
  const netProfitEur = volumeEur * 0.10; // 10% commission
  const matchRate = totalRequestsCount > 0 ? Math.round((completedJobsCount / totalRequestsCount) * 100) : 0;

  // Escrow Balance (Matched jobs)
  const matchedRequests = await prisma.request.findMany({
    where: { status: "MATCHED" },
    select: { budget: true, currency: true }
  });
  const escrowBalanceEur = matchedRequests.filter(r => r.currency === "EUR" && r.budget).reduce((sum, r) => sum + (r.budget as number), 0);

  // Category Distribution
  const categoryStats = await prisma.request.groupBy({
    by: ['categoryId'],
    _count: { id: true },
  });
  const categories = await prisma.category.findMany({ select: { id: true, nameTr: true }});
  
  const categoryDistribution = categoryStats.map(stat => {
    const cat = categories.find(c => c.id === stat.categoryId);
    return {
      name: cat ? cat.nameTr : "Diğer",
      value: stat._count.id
    };
  }).sort((a, b) => b.value - a.value);

  // Monthly Volume (Last 6 Months logic based on JS aggregation since data is small)
  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const monthlyVolumeMap: Record<string, number> = {};
  
  completedJobs.forEach(job => {
    if (!job.completedAt || job.currency !== "EUR") return;
    const date = new Date(job.completedAt);
    const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    monthlyVolumeMap[key] = (monthlyVolumeMap[key] || 0) + job.finalPrice;
  });

  const monthlyVolume = Object.entries(monthlyVolumeMap).map(([month, volume]) => ({ month, volume }));

  // Top 5 Providers
  const topProviders = await prisma.provider.findMany({
    orderBy: { completedJobsCount: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      completedJobsCount: true,
      ratingAvg: true,
      category: { select: { nameTr: true } }
    }
  });

  res.json({
    usersCount,
    providersCount,
    activeRequestsCount,
    completedJobsCount,
    volumeEur,
    volumeMkd,
    netProfitEur,
    escrowBalanceEur,
    matchRate,
    categoryDistribution,
    monthlyVolume,
    topProviders
  });
});

adminRouter.get("/providers", async (req, res) => {
  const providers = await prisma.provider.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(providers);
});

adminRouter.patch("/providers/:id/verify", async (req, res) => {
  const { status } = req.body; // PENDING, APPROVED, REJECTED
  if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const updated = await prisma.provider.update({
    where: { id: req.params.id },
    data: { verificationStatus: status as any },
  });
  
  res.json(updated);
});

adminRouter.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

adminRouter.get("/requests", requireAuth, async (req, res) => {
  if (req.auth!.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const requests = await prisma.request.findMany({
    include: { customer: true, category: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(requests);
});

adminRouter.get("/payments", requireAuth, async (req, res) => {
  if (req.auth!.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const payments = await prisma.payment.findMany({
    include: {
      job: { include: { request: { include: { customer: true } }, provider: true } }
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(payments);
});

adminRouter.post("/payments/:id/confirm", requireAuth, async (req, res) => {
  if (req.auth!.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!payment || payment.status !== "PENDING") return res.status(400).json({ error: "Invalid payment" });

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });
    await tx.job.update({
      where: { id: payment.jobId },
      data: { status: "IN_PROGRESS" },
    });
    return p;
  });

  const job = await prisma.job.findUnique({ where: { id: payment.jobId }});
  await sendToUser(job!.providerId, "provider", "Ödeme Havuza Ulaştı", "Müşterinin ödemesi onaylandı. İşe başlayabilirsiniz!", { jobId: job!.id });

  res.json(updated);
});

adminRouter.post("/payments/:id/payout", requireAuth, async (req, res) => {
  if (req.auth!.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const payment = await prisma.payment.findUnique({ where: { id: req.params.id }, include: { job: true } });
  if (!payment || payment.status !== "CONFIRMED" || payment.job.status !== "COMPLETED") {
    return res.status(400).json({ error: "Invalid payout state" });
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { paidOutAt: new Date() },
  });

  await sendToUser(payment.job.providerId, "provider", "Ödemeniz Gönderildi", "İşin bedeli banka hesabınıza aktarılmıştır.", { jobId: payment.jobId });

  res.json(updated);
});

adminRouter.get("/disputes", async (req, res) => {
  const disputedJobs = await prisma.job.findMany({
    where: { status: "DISPUTED" },
    include: {
      request: { include: { customer: true, messages: { orderBy: { createdAt: "asc" } } } },
      provider: true,
      payment: true,
    },
    orderBy: { startedAt: "desc" },
  });
  res.json(disputedJobs);
});

adminRouter.post("/jobs/:id/resolve-dispute", async (req, res) => {
  const { resolution } = req.body; // "COMPLETED" (Usta Hakli) veya "CANCELLED" (Musteri Hakli/Iptal)
  if (resolution !== "COMPLETED" && resolution !== "CANCELLED") {
    return res.status(400).json({ error: "Geçersiz çözüm kararı." });
  }

  const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: { request: true } });
  if (!job || job.status !== "DISPUTED") {
    return res.status(400).json({ error: "Bu iş ihtilaflı durumda değil." });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const j = await tx.job.update({
      where: { id: job.id },
      data: { status: resolution, completedAt: resolution === "COMPLETED" ? new Date() : null },
    });
    
    if (resolution === "CANCELLED") {
      await tx.payment.updateMany({
        where: { jobId: job.id },
        data: { status: "CANCELLED" }
      });
      await tx.request.update({
        where: { id: job.requestId },
        data: { status: "CANCELLED" }
      });
    } else {
      await tx.request.update({
        where: { id: job.requestId },
        data: { status: "COMPLETED" }
      });
    }

    return j;
  });

  const msgCustomer = resolution === "COMPLETED" ? "Şikayetiniz incelendi. İtiraz reddedildi, iş tamamlandı sayıldı." : "Şikayetiniz incelendi. Haklı bulundunuz, iş iptal edildi ve iadeniz yapılacaktır.";
  const msgProvider = resolution === "COMPLETED" ? "İhtilaf incelendi. Haklı bulundunuz, iş tamamlandı sayıldı." : "İhtilaf incelendi. Müşteri haklı bulundu, iş iptal edildi.";

  await sendToUser(job.request.customerId, "customer", "Şikayet Sonuçlandı", msgCustomer, { jobId: job.id });
  await sendToUser(job.providerId, "provider", "İhtilaf Sonuçlandı", msgProvider, { jobId: job.id });
  
  res.json(updated);
});

// Kategori Yönetimi
adminRouter.post("/categories", async (req, res) => {
  const { slug, nameTr, nameEn, nameMk, nameSq } = req.body;
  if (!slug || !nameTr) return res.status(400).json({ error: "Slug ve NameTr zorunludur." });

  try {
    const category = await prisma.category.create({
      data: { slug, nameTr, nameEn: nameEn || "", nameMk: nameMk || "", nameSq: nameSq || "" }
    });
    res.json(category);
  } catch (e) {
    res.status(400).json({ error: "Kategori oluşturulamadı. Slug benzersiz olmalı." });
  }
});

adminRouter.put("/categories/:id", async (req, res) => {
  const { slug, nameTr, nameEn, nameMk, nameSq } = req.body;
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { 
        slug, 
        nameTr, 
        nameEn: nameEn || "", 
        nameMk: nameMk || "", 
        nameSq: nameSq || "" 
      }
    });
    res.json(category);
  } catch (e: any) {
    console.error("Kategori güncelleme hatası:", e);
    res.status(400).json({ error: "Güncelleme başarısız: " + e.message });
  }
});

adminRouter.delete("/categories/:id", async (req, res) => {
  try {
    const count = await prisma.provider.count({ where: { categoryId: req.params.id } });
    if (count > 0) return res.status(400).json({ error: "Bu kategoriye kayıtlı ustalar var, silinemez." });

    const reqCount = await prisma.request.count({ where: { categoryId: req.params.id } });
    if (reqCount > 0) return res.status(400).json({ error: "Bu kategoriye ait iş talepleri var, silinemez." });

    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: "Silme işlemi başarısız." });
  }
});

// Yasaklama (Ban) İşlemleri
adminRouter.post("/users/:id/toggle-ban", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isBanned: !user.isBanned }
  });
  res.json(updated);
});

adminRouter.post("/providers/:id/toggle-ban", async (req, res) => {
  const provider = await prisma.provider.findUnique({ where: { id: req.params.id } });
  if (!provider) return res.status(404).json({ error: "Usta bulunamadı." });
  const updated = await prisma.provider.update({
    where: { id: req.params.id },
    data: { isBanned: !provider.isBanned }
  });
  res.json(updated);
});

// Toplu Bildirim (Push Notification) Gönderme
adminRouter.post("/notifications/broadcast", async (req, res) => {
  const { title, message, audience } = req.body;
  if (!title || !message || !audience) return res.status(400).json({ error: "Eksik bilgi" });

  let targetRole = undefined;
  if (audience === "CUSTOMERS") targetRole = "customer";
  if (audience === "PROVIDERS") targetRole = "provider";

  const whereClause = targetRole ? { role: targetRole } : {};
  const pushTokens = await prisma.pushToken.findMany({ where: whereClause });

  if (pushTokens.length === 0) return res.json({ success: true, count: 0 });

  // Expo API'sine toplu istek atıyoruz
  const fetch = require('node-fetch'); // or use native fetch if Node 18+
  const messages = pushTokens.map(pt => ({
    to: pt.token,
    sound: 'default',
    title,
    body: message,
  }));

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.error("Broadcast push error:", error);
  }

  res.json({ success: true, count: pushTokens.length });
});
