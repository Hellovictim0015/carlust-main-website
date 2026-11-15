import "server-only";
import { api } from "./backend";

/** A trip row from `/api/booking/orders` or `/host/mybooking`. */
export type BookingRow = {
  id: string;
  carTitle: string;
  numberPlate: string;
  image: string;
  amount: number;
  totalHours: number;
  status: string;
  bookingStarted: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  customerName: string;
  selfBook: boolean;
};

const s = (v: unknown) => (v == null ? "" : String(v));
const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
type Raw = Record<string, unknown>;

export function toRow(r: Raw): BookingRow {
  const user = (r.user ?? {}) as Raw;
  const first = s(user.firstName ?? r.userFirstName ?? r.firstName);
  const last = s(user.lastName ?? r.userLastName ?? r.lastName);
  const images = Array.isArray(r.images) ? r.images : [];
  return {
    id: s(r.id),
    carTitle: s(r.carTitle ?? (r.car as Raw | undefined)?.title),
    numberPlate: s(r.carNumberPlate ?? r.numberPlate ?? (r.car as Raw | undefined)?.numberPlate),
    image: s(images[0]),
    amount: n(r.amount),
    totalHours: n(r.totalHours),
    status: s(r.status).toUpperCase(),
    bookingStarted: s(r.bookingStarted).toUpperCase(),
    startDate: s(r.startDate ?? r.bookingStartDateTime),
    endDate: s(r.endDate ?? r.bookingEndDateTime),
    createdAt: s(r.createdAt),
    customerName: `${first} ${last}`.trim() || s(r.userName),
    selfBook: r.selfBook === true || r.selfBook === 1 || r.isSelfBook === true,
  };
}

export type StatusTone = "upcoming" | "ongoing" | "completed" | "cancelled";

/** Trip badge (ride_card.dart `_statusConfigFor`). */
export function tripStatus(status: string, started: string): { label: string; tone: StatusTone } {
  if (status === "CANCELLED") return { label: "Cancelled", tone: "cancelled" };
  if (status === "CONFIRMED" || status === "PENDING" || (status === "PAYMENT_COMPLETED" && started === "NOT_STARTED")) {
    return { label: "Upcoming", tone: "upcoming" };
  }
  if (status === "START" || ((status === "HOST_CONFIRMED" || status === "ONGOING") && started === "ONGOING")) {
    return { label: "Ongoing", tone: "ongoing" };
  }
  if (status === "COMPLETED" && (started === "COMPLETED" || !started)) return { label: "Completed", tone: "completed" };
  return { label: "Upcoming", tone: "upcoming" };
}

export async function getOrders(tab: "upcoming" | "completed", page: number) {
  const res = await api<{ data?: Raw[]; pagination?: { hasNextPage?: boolean } }>("/api/booking/orders", {
    query: { tab, page, limit: 10 },
  });
  const rows = (res.data ?? []).map(toRow).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { rows, hasNext: res.pagination?.hasNextPage === true };
}

export type Reservation = BookingRow & {
  carId: string;
  city: string;
  paymentId: string;
  pricePerHour: number;
  securityDeposit: number;
  doorstepAmount: number;
  doorstepDistance: number;
  userLocation: string;
  hostId: string;
  hostName: string;
  hostProfilePic: string;
  hostPhone: string;
  hostDetailsHidden: boolean;
  customerVerified: boolean | null;
  userRating: string | null;
  couponCode: string;
  refund: { status: string; adminNote: string } | null;
  // Host-side fields
  userId: string;
  customerPhone: string;
  customerEmail: string;
  customerDetailsHidden: boolean;
  pickupPhotos: string[];
  dropPhotos: string[];
};

export async function getReservation(id: string): Promise<Reservation | null> {
  const res = await api<{ reservation?: Raw; booking?: Raw }>(`/api/booking/book/${encodeURIComponent(id)}`);
  const r = res.reservation ?? res.booking;
  if (!r) return null;
  const user = (r.user ?? {}) as Raw;
  const refund = r.refundRequest as Raw | null | undefined;
  return {
    ...toRow(r),
    carId: s(r.carId),
    city: s(r.city),
    paymentId: s(r.paymentId),
    pricePerHour: n(r.pricePerHour),
    securityDeposit: n(r.securityDeposit),
    doorstepAmount: n(r.doorstepAmount ?? r.doorStepAmount),
    doorstepDistance: n(r.doorstepDistance),
    userLocation: s(r.userLocation ?? r.customAddress),
    hostId: s(r.hostId),
    hostName: s(r.hostName) || "Host",
    hostProfilePic: s(r.hostProfilePic),
    hostPhone: s(r.hostPhone),
    hostDetailsHidden: r.hostDetailsHidden === true,
    customerVerified: "customerVerified" in r ? r.customerVerified === true || r.customerVerified === 1 : null,
    userRating: r.userRating == null ? null : s(r.userRating),
    couponCode: s(r.couponCode),
    refund: refund ? { status: s(refund.status) || "PENDING", adminNote: s(refund.adminNote) } : null,
    userId: s(r.userId ?? user.id),
    customerPhone: s(user.phoneNumber ?? r.userPhone ?? r.phoneNumber),
    customerEmail: s(user.email ?? r.userEmail ?? r.email),
    customerDetailsHidden: r.customerDetailsHidden === true,
    pickupPhotos: Array.isArray(r.pickupPhotos) ? r.pickupPhotos.map(s) : [],
    dropPhotos: Array.isArray(r.dropPhotos) ? r.dropPhotos.map(s) : [],
  };
}
