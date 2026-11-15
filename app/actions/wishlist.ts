"use server";

import { api, errorMessage } from "@/lib/backend";
import { getToken } from "@/lib/session";

type Favorite = { car_id?: string | number };

/** Car ids in the user's Wishlists; empty when signed out. */
export async function getFavoriteIds(): Promise<string[]> {
  if (!(await getToken())) return [];
  try {
    const res = await api<{ data?: Favorite[] }>("/wishlist/my-favorites", { query: { page: 1, limit: 500 } });
    return (res.data ?? []).map((f) => String(f.car_id ?? "")).filter(Boolean);
  } catch {
    return [];
  }
}

export type ToggleResult = { ok: true; saved: boolean } | { ok: false; needLogin?: boolean; error: string };

export async function toggleFavorite(carId: string, save: boolean): Promise<ToggleResult> {
  if (!(await getToken())) return { ok: false, needLogin: true, error: "Please log in to save cars." };
  try {
    if (save) await api("/wishlist/add-favorites", { body: { car_id: carId } });
    else await api(`/wishlist/remove/${encodeURIComponent(carId)}`, { method: "DELETE" });
    return { ok: true, saved: save };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}
