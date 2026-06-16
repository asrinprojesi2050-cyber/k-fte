import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { sendToUser } from "../services/push";

export const offersRouter = Router();

const createOfferSchema = z.object({
  requestId: z.string().uuid(),
  price: z.number().positive(),
  message: z.string().optional(),
});

offersRouter.post("/", requireAuth, requireRole("provider"), async (req, res) => {
  const parsed = createOfferSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const request = await prisma.request.findUnique({ where: { id: parsed.data.requestId } });
  if (!request || request.status !== "OPEN") {
    return res.status(400).json({ error: "Request is not open for offers" });
  }

  const offer = await prisma.offer.create({
    data: {
      requestId: parsed.data.requestId,
      providerId: req.auth!.id,
      price: parsed.data.price,
      message: parsed.data.message,
    },
  });

  const provider = await prisma.provider.findUnique({ where: { id: req.auth!.id } });
  sendToUser(request.customerId, "customer", "Yeni teklif", `${provider?.name ?? "Bir usta"} ${offer.price} EUR teklif verdi.`, { requestId: request.id });

  res.status(201).json(offer);
});

offersRouter.post("/:id/withdraw", requireAuth, requireRole("provider"), async (req, res) => {
  const offer = await prisma.offer.findUnique({ where: { id: req.params.id } });
  if (!offer || offer.providerId !== req.auth!.id) {
    return res.status(404).json({ error: "Not found" });
  }

  const updated = await prisma.offer.update({
    where: { id: offer.id },
    data: { status: "WITHDRAWN" },
  });
  res.json(updated);
});

// Customer accepts an offer: creates the job, marks the request matched,
// and rejects the other pending offers for the same request.
offersRouter.post("/:id/accept", requireAuth, requireRole("customer"), async (req, res) => {
  const offer = await prisma.offer.findUnique({ where: { id: req.params.id }, include: { request: true } });
  if (!offer || offer.request.customerId !== req.auth!.id) {
    return res.status(404).json({ error: "Not found" });
  }
  if (offer.status !== "PENDING" || offer.request.status !== "OPEN") {
    return res.status(400).json({ error: "Offer can no longer be accepted" });
  }

  const job = await prisma.$transaction(async (tx) => {
    await tx.offer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } });
    await tx.offer.updateMany({
      where: { requestId: offer.requestId, id: { not: offer.id }, status: "PENDING" },
      data: { status: "REJECTED" },
    });
    await tx.request.update({ where: { id: offer.requestId }, data: { status: "MATCHED" } });

    return tx.job.create({
      data: {
        requestId: offer.requestId,
        offerId: offer.id,
        providerId: offer.providerId,
        finalPrice: offer.price,
      },
    });
  });

  await sendToUser(offer.providerId, "provider", "Teklifin kabul edildi", `Talebiniz için teklifiniz kabul edildi. İş başlıyor!`, { requestId: offer.requestId, jobId: job.id });

  res.status(201).json(job);
});
