import { prisma } from "../db";
import { getIO } from "../socket";

interface ExpoPushMessage {
  to: string;
  sound?: string;
  title?: string;
  body?: string;
  data?: Record<string, string>;
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function sendPushNotification(token: string, title: string, body: string, data?: Record<string, string>) {
  const message: ExpoPushMessage = { to: token, sound: "default", title, body, data };
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    const result: any = await res.json();
    if (result.errors) {
      console.error("Push notification error:", result.errors);
    }
    return result;
  } catch (err) {
    console.error("Push notification failed:", err);
  }
}

export async function sendToUser(userId: string, role: string, title: string, body: string, data?: Record<string, string>) {
  // Emit real-time notification via Socket.IO
  try {
    const io = getIO();
    io.to(`user_${userId}`).emit("notification", { title, body, data, role });
  } catch (err) {
    // Socket.io might not be initialized during tests or startup
    console.warn("Socket.io emit failed:", err);
  }

  const tokens = await prisma.pushToken.findMany({ where: { userId, role } });
  for (const t of tokens) {
    await sendPushNotification(t.token, title, body, data);
  }
}

export async function sendToAllProviders(title: string, body: string, data?: Record<string, string>) {
  // We can't easily emit to all providers via a single socket room unless we have a "providers" room.
  // For now, we will just send push notifications to their tokens.
  const tokens = await prisma.pushToken.findMany({ where: { role: "provider" } });
  for (const t of tokens) {
    await sendPushNotification(t.token, title, body, data);
  }
}
