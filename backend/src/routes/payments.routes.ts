import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

export const paymentsRouter = Router();

// Ustanin tahsil ettigi nakit odemeler ve platforma borclu oldugu komisyon.
paymentsRouter.get("/mine", requireAuth, requireRole("provider"), async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { job: { providerId: req.auth!.id } },
    include: { job: true },
    orderBy: { createdAt: "desc" },
  });

  const totalCommissionDue = payments.reduce((sum, p) => sum + p.commissionAmount, 0);
  res.json({ payments, totalCommissionDue });
});
