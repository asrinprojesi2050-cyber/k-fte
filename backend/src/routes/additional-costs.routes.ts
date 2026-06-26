import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { sendToUser } from "../services/push";

export const additionalCostsRouter = Router();

const createCostSchema = z.object({
  jobId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().min(3),
});

// Provider adds an additional cost
additionalCostsRouter.post("/", requireAuth, requireRole("provider"), async (req, res) => {
  const parsed = createCostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const job = await prisma.job.findUnique({ where: { id: parsed.data.jobId }, include: { request: true } });
  if (!job || job.providerId !== req.auth!.id) {
    return res.status(404).json({ error: "Job not found" });
  }
  if (job.status === "COMPLETED" || job.status === "CANCELLED") {
    return res.status(400).json({ error: "Job is closed" });
  }

  const cost = await prisma.additionalCost.create({
    data: {
      jobId: parsed.data.jobId,
      amount: parsed.data.amount,
      description: parsed.data.description,
      status: "PENDING",
    },
  });

  await sendToUser(job.request.customerId, "customer", "Ekstra Masraf Onayı Bekleniyor", `Usta, ${parsed.data.description} için ${parsed.data.amount} ${job.currency} ek masraf onayınızı bekliyor.`, { jobId: job.id });

  res.status(201).json(cost);
});

// Customer approves
additionalCostsRouter.post("/:id/approve", requireAuth, requireRole("customer"), async (req, res) => {
  const cost = await prisma.additionalCost.findUnique({ where: { id: req.params.id }, include: { job: { include: { request: true } } } });
  if (!cost || cost.job.request.customerId !== req.auth!.id) {
    return res.status(404).json({ error: "Not found" });
  }
  if (cost.status !== "PENDING") {
    return res.status(400).json({ error: "Already processed" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.additionalCost.update({ where: { id: cost.id }, data: { status: "ACCEPTED" } });
    await tx.job.update({ where: { id: cost.jobId }, data: { finalPrice: cost.job.finalPrice + cost.amount } });
    
    // In a real app, we would charge the customer's card for the additional amount here.
  });

  await sendToUser(cost.job.providerId, "provider", "Ek Masraf Onaylandı", `Müşteri ${cost.amount} ${cost.job.currency} tutarındaki ek masrafı onayladı.`, { jobId: cost.jobId });

  res.json({ success: true });
});

// Customer rejects
additionalCostsRouter.post("/:id/reject", requireAuth, requireRole("customer"), async (req, res) => {
  const cost = await prisma.additionalCost.findUnique({ where: { id: req.params.id }, include: { job: { include: { request: true } } } });
  if (!cost || cost.job.request.customerId !== req.auth!.id) {
    return res.status(404).json({ error: "Not found" });
  }
  if (cost.status !== "PENDING") {
    return res.status(400).json({ error: "Already processed" });
  }

  const updated = await prisma.additionalCost.update({ where: { id: cost.id }, data: { status: "REJECTED" } });
  
  await sendToUser(cost.job.providerId, "provider", "Ek Masraf Reddedildi", `Müşteri ek masrafı onaylamadı. Lütfen işleme mevcut bütçeyle devam edin veya müşteriyle iletişime geçin.`, { jobId: cost.jobId });

  res.json(updated);
});
