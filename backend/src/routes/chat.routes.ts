import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { sendToUser } from "../services/push";

export const chatRouter = Router();

const sendSchema = z.object({
  text: z.string().min(1).max(1000),
});

// List conversations (grouped by request) for the current user
chatRouter.get("/conversations", requireAuth, async (req, res) => {
  const { id, role } = req.auth!;

  // Get all requests the user is part of (as customer or provider with offers)
  const whereRequest = role === "customer"
    ? { customerId: id }
    : { offers: { some: { providerId: id } } };

  const requests = await prisma.request.findMany({
    where: whereRequest,
    include: {
      category: { select: { nameTr: true } },
      customer: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const conversations = await Promise.all(
    requests.map(async (req) => {
      const lastMsg = req.messages[0];
      const otherName = role === "customer"
        ? await prisma.provider.findFirst({
            where: { offers: { some: { requestId: req.id } } },
            select: { name: true },
          }).then((p) => p?.name ?? "Usta")
        : req.customer.name;

      return {
        requestId: req.id,
        category: req.category.nameTr,
        description: req.description.substring(0, 80),
        otherName,
        lastMessage: lastMsg?.text ?? "Henüz mesaj yok",
        lastMessageAt: lastMsg?.createdAt ?? req.createdAt,
        lastSenderRole: lastMsg?.senderRole ?? null,
      };
    })
  );

  res.json(conversations);
});

// Get messages for a specific request
chatRouter.get("/messages/:requestId", requireAuth, async (req, res) => {
  const { requestId } = req.params;
  const { id, role } = req.auth!;

  // Verify user is part of this conversation
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      customer: { select: { id: true, name: true } },
      offers: { where: { status: { in: ["ACCEPTED", "PENDING"] } }, select: { providerId: true } },
    },
  });

  if (!request) return res.status(404).json({ error: "Request not found" });

  const isCustomer = request.customerId === id;
  const isProvider = request.offers.some((o) => o.providerId === id);
  if (!isCustomer && !isProvider) {
    return res.status(403).json({ error: "Not part of this conversation" });
  }

  const messages = await prisma.message.findMany({
    where: { requestId },
    orderBy: { createdAt: "asc" },
  });

  res.json({ messages, customer: { name: request.customer.name } });
});

// Send a message
chatRouter.post("/messages/:requestId", requireAuth, async (req, res) => {
  const { requestId } = req.params;
  const { id, role } = req.auth!;

  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  // Verify user is part of this conversation
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { offers: { where: { status: { in: ["ACCEPTED", "PENDING"] } }, select: { providerId: true } } },
  });

  if (!request) return res.status(404).json({ error: "Request not found" });

  const isCustomer = request.customerId === id;
  const isProvider = request.offers.some((o) => o.providerId === id);
  if (!isCustomer && !isProvider) {
    return res.status(403).json({ error: "Not part of this conversation" });
  }

  const message = await prisma.message.create({
    data: {
      requestId,
      senderId: id,
      senderRole: role,
      text: parsed.data.text,
    },
  });

  const otherRole = role === "customer" ? "provider" : "customer";
  const providerIds = request.offers.map((o) => o.providerId);
  const targetUserId = role === "customer" ? providerIds[0] : request.customerId;
  if (targetUserId) {
    const sender = role === "customer"
      ? await prisma.user.findUnique({ where: { id } })
      : await prisma.provider.findUnique({ where: { id } });
    sendToUser(targetUserId, otherRole, "Yeni mesaj", `${sender?.name ?? "Biri"}: ${parsed.data.text.substring(0, 80)}`, { requestId });
  }

  res.status(201).json(message);
});
