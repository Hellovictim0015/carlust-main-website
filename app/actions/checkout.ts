"use server";

import { revalidatePath } from "next/cache";
import { getCarDetail } from "@/lib/api";
import { api, errorMessage, getCurrentUser } from "@/lib/backend";
import { istLocalToMs } from "@/lib/datetime";
import { billableHours, isCouponActive, priceBreakdown, type Coupon } from "@/lib/pricing";

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function toCoupon(c: Record<string, unknown>): Coupon {
  const orNull = (v: unknown) => (v == null || v === "" ? null : num(v));
  return {
    id: String(c.id),
    code: String(c.code ?? ""),
    discountType: c.discountType === "PERCENT" ? "PERCENT" : "FIXED",
    discountValue: num(c.discountValue),
    minAmount: num(c.minAmount),
    maxDiscount: orNull(c.maxDiscount),
    startDate: String(c.startDate ?? ""),
    endDate: String(c.endDate ?? ""),
    minHours: orNull(c.minHours),
    durationUnit:
      c.durationUnit === "WEEKS" || c.durationUnit === "MONTHS" || c.durationUnit === "HOURS" ? c.durationUnit : null,
    belowMinHoursDiscount: orNull(c.belowMinHoursDiscount),
  };
}

/** Currently valid coupons (`/coupon/all`, signed-in only). */
export async function listCoupons(): Promise<Coupon[]> {
  try {
    const res = await api<{ data?: Record<string, unknown>[] }>("/coupon/all");
    return (res.data ?? []).map(toCoupon).filter((c) => isCouponActive(c));
  } catch {
    return [];
  }
}

export type OrderInput = {
  carId: string;
  start: string; // IST datetime-local
  end: string;
  doorstepKm: number | null;
  address: string;
  lat: number | null;
  lng: number | null;
  couponCode: string | null;
};

export type OrderResult =
  | {
      ok: true;
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      prefill: { name: string; email: string; contact: string };
    }
  | { ok: false; error: string; needProfile?: boolean };

/**
 * Recomputes the price on the server (never trusts the browser's total) and
 * creates the Razorpay order, like the app's `_handleProceedToPay`.
 */
export async function createOrder(input: OrderInput): Promise<OrderResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to proceed to payment." };
  if (!user.name || !user.email) {
    return { ok: false, needProfile: true, error: "Please add your name and email to continue." };
  }
  if (!user.phoneNumber) return { ok: false, error: "Please add your phone number to proceed to payment." };

  const car = await getCarDetail(input.carId);
  if (!car || !car.bookable) return { ok: false, error: "This car can't be booked right now." };

  const startMs = istLocalToMs(input.start);
  const endMs = istLocalToMs(input.end);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return { ok: false, error: "Please choose a valid start and end time." };
  }
  if (startMs < Date.now() - 5 * 60_000) return { ok: false, error: "The start time is in the past." };
  if (input.doorstepKm != null && (!car.doorstepAvailable || !input.address.trim())) {
    return { ok: false, error: "Please add a delivery address for doorstep delivery." };
  }

  const hours = billableHours(startMs, endMs);
  let coupon: Coupon | null = null;
  if (input.couponCode) {
    coupon = (await listCoupons()).find((c) => c.code.toLowerCase() === input.couponCode!.toLowerCase()) ?? null;
    if (!coupon) return { ok: false, error: "That coupon is no longer available." };
  }
  const doorstepKm = input.doorstepKm != null ? Math.max(0, Math.ceil(input.doorstepKm)) : null;
  const b = priceBreakdown({ ratePerHour: car.ratePerHour, hours, securityDeposit: car.securityDeposit, doorstepKm, coupon });

  try {
    const res = await api<{ success?: boolean; orderId?: string; amount?: number; currency?: string; keyId?: string }>(
      "/api/booking/create-order",
      {
        body: {
          carId: car.id,
          startDate: new Date(startMs).toISOString(),
          endDate: new Date(endMs).toISOString(),
          amount: b.finalAmount,
          totalHours: hours,
          ...(coupon ? { couponCode: coupon.code, couponBaseAmount: b.taxable } : {}),
        },
      },
    );
    if (!res.success || !res.orderId) return { ok: false, error: "Failed to create payment order. Please try again." };
    return {
      ok: true,
      orderId: res.orderId,
      amount: Math.round(num(res.amount)),
      currency: res.currency || "INR",
      keyId: res.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_RwF4D8Hluv8sVW",
      prefill: { name: user.name, email: user.email, contact: user.phoneNumber },
    };
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Failed to create reservation. Please try again.") };
  }
}

export type VerifyInput = OrderInput & {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type VerifyResult = { ok: true; verified: boolean } | { ok: false; error: string };

/** Confirms the booking after Razorpay success (`/api/booking/verify-payment`). */
export async function verifyPayment(input: VerifyInput): Promise<VerifyResult> {
  const car = await getCarDetail(input.carId);
  const startMs = istLocalToMs(input.start);
  const endMs = istLocalToMs(input.end);
  if (!car || !Number.isFinite(startMs) || !Number.isFinite(endMs)) return { ok: false, error: "Invalid booking." };

  const hours = billableHours(startMs, endMs);
  const coupon = input.couponCode
    ? ((await listCoupons()).find((c) => c.code.toLowerCase() === input.couponCode!.toLowerCase()) ?? null)
    : null;
  const doorstepKm = input.doorstepKm != null ? Math.max(0, Math.ceil(input.doorstepKm)) : null;
  const b = priceBreakdown({ ratePerHour: car.ratePerHour, hours, securityDeposit: car.securityDeposit, doorstepKm, coupon });

  try {
    const res = await api<{ success?: boolean; message?: string; data?: { success?: boolean; message?: string } }>(
      "/api/booking/verify-payment",
      {
        body: {
          carId: car.id,
          startDate: new Date(startMs).toISOString(),
          endDate: new Date(endMs).toISOString(),
          amount: b.finalAmount,
          totalHours: hours,
          userLocation: input.address,
          userLat: input.lat != null ? String(input.lat) : "",
          userLong: input.lng != null ? String(input.lng) : "",
          doorstepAmount: b.totalDoorstep,
          doorstepDistance: doorstepKm ?? 0,
          couponCode: coupon?.code ?? "",
          razorpay_order_id: input.razorpay_order_id,
          razorpay_payment_id: input.razorpay_payment_id,
          razorpay_signature: input.razorpay_signature,
        },
      },
    );
    const success = res.data?.success === true || res.success === true;
    if (!success) return { ok: false, error: res.data?.message || res.message || "Payment verification failed." };
    revalidatePath("/trips");
    const user = await getCurrentUser();
    return { ok: true, verified: Boolean(user?.isVerified) };
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Payment verification failed.") };
  }
}
