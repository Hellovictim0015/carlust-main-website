"use server";

import { revalidatePath } from "next/cache";
import { api, errorMessage } from "@/lib/backend";

export type TripActionResult = { ok: true; message: string } | { ok: false; error: string };

export async function cancelBooking(bookingId: string, reason: string): Promise<TripActionResult> {
  if (!reason.trim()) return { ok: false, error: "Please choose a reason." };
  try {
    await api(`/api/booking/cancel-booking/${encodeURIComponent(bookingId)}`, {
      method: "PUT",
      body: { cancellationReason: reason.trim() },
    });
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Could not cancel the booking. Please try again.") };
  }
  revalidatePath("/trips");
  return { ok: true, message: "Your booking has been cancelled successfully." };
}

export async function requestRefund(bookingId: string): Promise<TripActionResult> {
  try {
    const res = await api<{ message?: string }>(`/api/booking/refund-request/${encodeURIComponent(bookingId)}`, {
      body: {},
    });
    revalidatePath("/trips");
    return { ok: true, message: res?.message || "Refund requested." };
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Could not request a refund. Please try again.") };
  }
}

export async function submitReview(carId: string, rating: number, comment: string): Promise<TripActionResult> {
  const stars = Math.min(5, Math.max(1, Math.round(rating)));
  try {
    await api("/rating/reviews", { body: { carId, rating: stars, comment: comment.trim() } });
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Could not submit your review.") };
  }
  revalidatePath("/trips");
  return { ok: true, message: "Thanks for your review!" };
}
