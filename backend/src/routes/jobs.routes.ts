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
    include: { request: true, offer: true, payment: true },
    orderBy: { startedAt: "desc" },
  });
  res.json(jobs);
});

jobsRouter.get("/:id", requireAuth, async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      request: { include: { category: true } },
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

// Musteri odemenin (nakit) yapildigini onaylar. MVP'de gercek escrow yok,
// bu onay isin ve odemenin kapandigini isaretler.
jobsRouter.post("/:id/confirm-payment", requireAuth, async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: { request: true } });
  if (!job || job.request.customerId !== req.auth!.id) {
    return res.status(404).json({ error: "Not found" });
  }
  if (job.status !== "COMPLETED") {
    return res.status(400).json({ error: "Job is not marked as completed yet" });
  }

  const commissionAmount = job.finalPrice * COMMISSION_RATE;

  const payment = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        jobId: job.id,
        amount: job.finalPrice,
        commissionAmount,
        method: "CASH",
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    await tx.request.update({ where: { id: job.requestId }, data: { status: "COMPLETED" } });
    await tx.provider.update({
      where: { id: job.providerId },
      data: { completedJobsCount: { increment: 1 } },
    });

    return payment;
  });

  await sendToUser(job.providerId, "provider", "Ödeme onaylandı", "Müşteri ödemeyi onayladı. Hesabına aktarılıyor.", { jobId: job.id });

  res.status(201).json(payment);
});
