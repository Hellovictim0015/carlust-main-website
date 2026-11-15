"use server";

import { API_BASE_URL } from "@/lib/api";

export type Broadcast = { id: string; title: string; body: string; link: string | null; createdAt: string };

/** Latest admin announcements ("Everyone" broadcasts) for the header bell. */
export async function getBroadcasts(): Promise<Broadcast[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notification/broadcasts?limit=20`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: Broadcast[] };
    return (json.data ?? []).map((b) => ({
      id: String(b.id),
      title: String(b.title ?? ""),
      body: String(b.body ?? ""),
      link: b.link ? String(b.link) : null,
      createdAt: String(b.createdAt ?? ""),
    }));
  } catch {
    return [];
  }
}
