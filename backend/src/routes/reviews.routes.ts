import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

export const reviewsRouter = Router();

const createReviewSchema = z.object({
  jobId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

reviewsRouter.post("/", requireAuth, requireRole("customer"), async (req, res) => {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const job = await prisma.job.findUnique({ where: { id: parsed.data.jobId }, include: { request: true } });
  if (!job || job.request.customerId !== req.auth!.id) {
    return res.status(404).json({ error: "Not found" });
  }
  if (job.status !== "COMPLETED") {
    return res.status(400).json({ error: "Job is not completed yet" });
  }

  const review = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        jobId: job.id,
        customerId: req.auth!.id,
        providerId: job.providerId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });

    const agg = await tx.review.aggregate({
      where: { providerId: job.providerId },
      _avg: { rating: true },
    });
    await tx.provider.update({
      where: { id: job.providerId },
      data: { ratingAvg: agg._avg.rating ?? parsed.data.rating },
    });

    return review;
  });

  res.status(201).json(review);
});
