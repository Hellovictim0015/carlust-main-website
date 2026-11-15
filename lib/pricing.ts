/** Business rules ported from the Carlust app (format_utils, app_constants, coupon_utils, checkout_screen). */

/** Minimum rental hours (kMinHour); also used for "Display total price". */
export const MIN_HOURS = 8;
export const QUICK_DURATIONS = [10, 12, 24, 48, 72] as const;
export const GST_RATE = 0.18;
export const DOORSTEP_FIXED = 200;
export const DOORSTEP_PER_KM = 22;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatInr = (amount: number) => inr.format(amount);

/** ₹99 for trips up to 24h, ₹199 beyond (calculateConvenienceFee). */
export const convenienceFee = (hours: number) => (hours <= 24 ? 99 : 199);

/** Hours between two instants, never below the minimum (checkout _durationHours). */
export function billableHours(startMs: number, endMs: number) {
  const h = (endMs - startMs) / 3_600_000;
  return h < MIN_HOURS ? MIN_HOURS : h;
}

export type Coupon = {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minAmount: number;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  minHours: number | null;
  durationUnit: "HOURS" | "WEEKS" | "MONTHS" | null;
  belowMinHoursDiscount: number | null;
};

const UNIT_HOURS = { HOURS: 1, WEEKS: 24 * 7, MONTHS: 24 * 30 } as const;

export function isCouponActive(c: Coupon, now = Date.now()) {
  return now >= Date.parse(c.startDate) && now <= Date.parse(c.endDate);
}

function applicableValue(c: Coupon, hours: number) {
  if (c.minHours != null && hours < c.minHours * UNIT_HOURS[c.durationUnit ?? "HOURS"]) {
    return c.belowMinHoursDiscount ?? 0;
  }
  return c.discountValue;
}

export function couponDiscount(c: Coupon, amount: number, hours: number) {
  if (amount < c.minAmount) return 0;
  const value = applicableValue(c, hours);
  let discount = c.discountType === "PERCENT" ? (amount * value) / 100 : value;
  if (c.discountType === "PERCENT" && c.maxDiscount != null) discount = Math.min(discount, c.maxDiscount);
  return Math.min(discount, amount);
}

export function describeCoupon(c: Coupon) {
  const off =
    c.discountType === "PERCENT"
      ? `${c.discountValue}% off${c.maxDiscount != null ? ` (up to ${formatInr(c.maxDiscount)})` : ""}`
      : `Flat ${formatInr(c.discountValue)} off`;
  return c.minAmount > 0 ? `${off} · Min order ${formatInr(c.minAmount)}` : off;
}

export type Breakdown = {
  hours: number;
  tripAmount: number;
  convenienceFee: number;
  doorstepFixed: number;
  doorstepDistanceFee: number;
  totalDoorstep: number;
  taxable: number;
  couponDiscount: number;
  gst: number;
  securityDeposit: number;
  finalAmount: number;
};

/** Same order of operations as the app's checkout `_breakdown`. */
export function priceBreakdown({
  ratePerHour,
  hours,
  securityDeposit,
  doorstepKm = null,
  coupon = null,
}: {
  ratePerHour: number;
  hours: number;
  securityDeposit: number;
  /** null = Pick Up Myself; a number = doorstep delivery distance in km. */
  doorstepKm?: number | null;
  coupon?: Coupon | null;
}): Breakdown {
  const tripAmount = Math.round(ratePerHour * hours);
  const fee = convenienceFee(hours);
  const doorstepFixed = doorstepKm != null ? DOORSTEP_FIXED : 0;
  const doorstepDistanceFee = doorstepKm != null ? doorstepKm * DOORSTEP_PER_KM : 0;
  const totalDoorstep = doorstepFixed + doorstepDistanceFee;
  const taxable = tripAmount + fee + totalDoorstep;
  const gst = Math.round(taxable * GST_RATE);
  const discount = coupon ? couponDiscount(coupon, taxable, hours) : 0;
  return {
    hours,
    tripAmount,
    convenienceFee: fee,
    doorstepFixed,
    doorstepDistanceFee,
    totalDoorstep,
    taxable,
    couponDiscount: discount,
    gst,
    securityDeposit,
    finalAmount: taxable - discount + gst + securityDeposit,
  };
}

/** Straight-line distance in km between two points (haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
