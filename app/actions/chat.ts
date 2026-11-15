"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, errorMessage } from "@/lib/backend";
import { loginHref } from "@/lib/nav";
import { getToken } from "@/lib/session";

/** Opens (or reuses) a conversation with a host/guest and goes to it. */
/** Bind all three args when used as a form action (the form passes FormData after them). */
export async function contactUser(participantId: string, returnTo: string, base: string) {
  if (!(await getToken())) redirect(loginHref(returnTo));
  let conversationId: string | undefined;
  try {
    const res = await api<{ conversationId?: string | number }>("/chat/conversations/start", {
      body: { participantId },
    });
    conversationId = res.conversationId != null ? String(res.conversationId) : undefined;
  } catch {
    // Fall through to the inbox.
  }
  const root = base === "/host/messages" ? base : "/messages";
  redirect(conversationId ? `${root}/${conversationId}` : root);
}

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendMessage(receiverId: string, conversationId: string, message: string): Promise<SendResult> {
  const text = message.trim();
  if (!text) return { ok: false, error: "Type a message first." };
  try {
    await api("/chat/send", { body: { receiverId, message: text } });
    revalidatePath(`/messages/${conversationId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Message not sent. Please try again.") };
  }
}
