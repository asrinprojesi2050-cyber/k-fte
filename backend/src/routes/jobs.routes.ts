import { Router } from "express";
import { prisma } from "../db";
import { COMMISSION_RATE } from "../config";
import { requireAuth } from "../middleware/auth";
import { sendToUser } from "../services/push";

export const jobsRouter = Router();

jobsRouter.get("/mine", requireAuth, async (req, res) => {
  const where =
    req.auth!.role === "provider"
      ? { providerId: req.auth!.id }
      : { request: { customerId: req.auth!.id } };

  const jobs = await prisma.job.findMany({
    where,
    include: { 
      request: { include: { category: true, customer: true } }, 
      offer: true, 
      payment: true 
    },
    orderBy: { startedAt: "desc" },
  });
  res.json(jobs);
});

jobsRouter.get("/:id", requireAuth, async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      request: { include: { category: true, customer: true } },
      provider: true,
      offer: true,
      payment: true,
      review: true,
    },
  });
  if (!job) return res.status(404).json({ error: "Not found" });
  const isOwner =
    job.providerId === req.auth!.id || (job as any).request.customerId === req.auth!.id;
  if (!isOwner) return res.status(403).json({ error: "Forbidden" });
  res.json(job);
});

// Usta isi tamamlandi olarak isaretler.
jobsRouter.post("/:id/complete", requireAuth, async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job || job.providerId !== req.auth!.id) {
    return res.status(404).json({ error: "Not found" });
  }
  if (job.status !== "IN_PROGRESS") {
    return res.status(400).json({ error: "Job is not in progress" });
  }

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  const jobWithRequest = await prisma.job.findUnique({ where: { id: job.id }, include: { request: true } });
  if (jobWithRequest) {
    sendToUser(jobWithRequest.request.customerId, "customer", "İş tamamlandı", "Usta işi tamamlandı olarak işaretledi. Kontrol edip onaylayabilirsin.", { jobId: job.id });
  }

  res.json(updated);
});

// İşi İhtilaflı (DISPUTED) duruma çeker ve şikayet sebebini kaydeder.
jobsRouter.post("/:id/dispute", requireAuth, async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: { request: true } });
  if (!job) return res.status(404).json({ error: "Not found" });
  
  const isOwner = job.providerId === req.auth!.id || job.request.customerId === req.auth!.id;
  if (!isOwner) return res.status(403).json({ error: "Forbidden" });

  if (job.status !== "IN_PROGRESS") {
    return res.status(400).json({ error: "Yalnızca devam eden işler için sorun bildirilebilir." });
  }

  const { reason } = req.body;
  if (!reason || typeof reason !== "string") {
    return res.status(400).json({ error: "Lütfen bir şikayet sebebi belirtin." });
  }

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: { status: "DISPUTED", disputeReason: reason },
  });

  // Karşı tarafa bildirim yolla
  const targetId = req.auth!.id === job.providerId ? job.request.customerId : job.providerId;
  const targetRole = req.auth!.id === job.providerId ? "customer" : "provider";
  
  await sendToUser(targetId, targetRole, "İş Askıya Alındı", "Karşı taraf iş ile ilgili sorun bildirdi. Yetkililer inceleyecek.", { jobId: job.id });

  res.json(updated);
});

// Müşteri parayı gönderdiğini beyan eder
jobsRouter.post("/:id/payment-sent", requireAuth, async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: { request: true } });
  if (!job || job.request.customerId !== req.auth!.id) {
    return res.status(404).json({ error: "Not found" });
  }
  if (job.status !== "WAITING_PAYMENT") {
    return res.status(400).json({ error: "Job is not waiting for payment" });
  }

  res.json({ ok: true, message: "Ödeme beyanı alındı, yönetici onaylayacak." });
});

// Usta iş durumu için kilometre taşı ekler (Örn: Yola Çıktı, Malzeme Alınıyor)
jobsRouter.post("/:id/milestone", requireAuth, async (req, res) => {
  const { milestone } = req.body;
  if (!milestone || typeof milestone !== "string") {
    return res.status(400).json({ error: "Milestone required" });
  }

  const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: { request: true } });
  if (!job || job.providerId !== req.auth!.id) {
    return res.status(404).json({ error: "Not found" });
  }

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: { milestone },
  });

  await sendToUser(job.request.customerId, "customer", "İş Durumu Güncellendi", `Usta iş durumunu değiştirdi: ${milestone}`, { jobId: job.id });

  res.json(updated);
});

// İptal ve Ceza Mantığı
jobsRouter.post("/:id/cancel", requireAuth, async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: { request: true } });
  if (!job) return res.status(404).json({ error: "Not found" });
  
  const isCustomer = job.request.customerId === req.auth!.id;
  const isProvider = job.providerId === req.auth!.id;
  
  if (!isCustomer && !isProvider) return res.status(403).json({ error: "Forbidden" });
  if (job.status === "COMPLETED" || job.status === "CANCELLED") {
    return res.status(400).json({ error: "Job already closed" });
  }

  // Ceza Mantığı (Son 2 saat kala iptal edilirse)
  let penaltyApplied = false;
  if (job.request.scheduledAt) {
    const hoursLeft = (new Date(job.request.scheduledAt).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hoursLeft > 0 && hoursLeft <= 2) {
      penaltyApplied = true;
      if (isCustomer) {
        await prisma.user.update({ where: { id: req.auth!.id }, data: { cancellationCount: { increment: 1 } } });
      } else {
        await prisma.provider.update({ where: { id: req.auth!.id }, data: { cancellationCount: { increment: 1 } } });
      }
    }
  }

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: { status: "CANCELLED" },
  });

  const targetId = isCustomer ? job.providerId : job.request.customerId;
  const targetRole = isCustomer ? "provider" : "customer";
  
  let msg = "Karşı taraf işi iptal etti.";
  if (penaltyApplied) msg += " (Geç iptal sebebiyle karşı tarafa ceza puanı uygulandı.)";

  await sendToUser(targetId, targetRole, "İş İptal Edildi", msg, { jobId: job.id });

  res.json({ updated, penaltyApplied });
});
