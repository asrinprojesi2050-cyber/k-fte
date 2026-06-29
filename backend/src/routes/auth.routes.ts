import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../db";
import { signToken } from "../middleware/auth";
import { createSmsProvider } from "../services/sms";

export const authRouter = Router();

const otpLimiter = rateLimit({ windowMs: 60_000, max: 3, message: { error: "Too many requests. Try again later." } });

const sms = createSmsProvider();

// In-memory OTP store. Replace with Redis for production scalability.
const otpStore = new Map<string, string>();

const requestOtpSchema = z.object({
  phone: z.string().min(6),
});

authRouter.post("/request-otp", otpLimiter, async (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(parsed.data.phone, code);

  await sms.send(parsed.data.phone, `Köfte dogrulama kodunuz: ${code}`);

  // Test asamasinda oldugumuz icin her zaman kodu donuyoruz:
  return res.json({ ok: true, code });
});

const verifyCustomerSchema = z.object({
  phone: z.string().min(6),
  code: z.string().length(6),
  name: z.string().min(2).optional(),
});

authRouter.post("/customer/verify-otp", async (req, res) => {
  const parsed = verifyCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { phone, code, name } = parsed.data;
  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev && otpStore.get(phone) !== code) {
    return res.status(401).json({ error: "Invalid code" });
  }
  otpStore.delete(phone);

  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone, name: name ?? phone },
  });

  const token = signToken({ id: user.id, role: "customer" });
  return res.json({ token, user });
});

const verifyProviderSchema = z.object({
  phone: z.string().min(6),
  code: z.string().length(6),
  name: z.string().min(2).optional(),
  categoryId: z.string().uuid().optional(),
  city: z.string().optional(),
});

authRouter.post("/provider/verify-otp", async (req, res) => {
  const parsed = verifyProviderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { phone, code, name, categoryId, city } = parsed.data;
  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev && otpStore.get(phone) !== code) {
    return res.status(401).json({ error: "Invalid code" });
  }
  otpStore.delete(phone);

  const existing = await prisma.provider.findUnique({ where: { phone } });
  if (!existing) {
    if (!name || !categoryId || !city) {
      return res
        .status(400)
        .json({ error: "name, categoryId and city are required for new providers" });
    }
    const provider = await prisma.provider.create({
      data: { phone, name, categoryId, city },
    });
    const token = signToken({ id: provider.id, role: "provider" });
    return res.json({ token, provider });
  }

  const token = signToken({ id: existing.id, role: "provider" });
  return res.json({ token, provider: existing });
});
