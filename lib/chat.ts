import "server-only";
import { api } from "./backend";

export type Conversation = { id: string; userId: string; name: string; image: string | null };
export type Message = { id: string; senderId: string; text: string; createdAt: string };

export async function getConversations(): Promise<Conversation[]> {
  const res = await api<{ conversations?: Record<string, unknown>[] }>("/chat/conversations");
  return (res.conversations ?? []).map((c) => ({
    id: String(c.conversationId ?? ""),
    userId: String(c.userId ?? ""),
    name: String(c.name ?? "Unknown"),
    image: typeof c.profilePic === "string" && c.profilePic ? c.profilePic : null,
  }));
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
    const res = await api<{ messages?: Record<string, unknown>[] }>(`/chat/messages/${encodeURIComponent(conversationId)}`);
    return (res.messages ?? [])
      .map((m) => ({
        id: String(m.id ?? ""),
        senderId: String(m.sender_id ?? ""),
        text: String(m.message ?? ""),
        createdAt: String(m.createdAt ?? ""),
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}
