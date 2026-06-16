import { apiFetch } from "./client";

export interface Conversation {
  requestId: string;
  category: string;
  description: string;
  otherName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderRole: string;
}

export interface Message {
  id: string;
  requestId: string;
  senderId: string;
  senderRole: string;
  text: string;
  createdAt: string;
}

export function fetchConversations(token?: string) {
  return apiFetch<Conversation[]>("/api/chat/conversations", { token });
}

export function fetchMessages(requestId: string, token?: string) {
  return apiFetch<{ messages: Message[]; customer: { name: string } }>(
    `/api/chat/messages/${requestId}`,
    { token }
  );
}

export function sendMessage(requestId: string, text: string, token?: string) {
  return apiFetch<Message>(`/api/chat/messages/${requestId}`, {
    method: "POST",
    token,
    body: { text },
  });
}
