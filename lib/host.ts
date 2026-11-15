import "server-only";
import { api } from "./backend";
import { toRow } from "./bookings";

type Raw = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v));
const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export async function getHostBookings(tab: "upcoming" | "completed", page: number) {
  const res = await api<{ data?: Raw[]; pagination?: { hasNextPage?: boolean } }>("/host/mybooking", {
    query: { tab, page, limit: 10 },
  });
  const rows = (res.data ?? []).map(toRow).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { rows, hasNext: res.pagination?.hasNextPage === true };
}

export type Listing = {
  id: string;
  title: string;
  image: string;
  ratePerHour: number;
  city: string;
  approval: string;
  enabled: boolean;
  repairMode: boolean;
  numberPlate: string;
};

export async function getMyListings(): Promise<Listing[]> {
  const res = await api<{ success?: boolean; cars?: Raw[]; message?: string }>("/host/car/my-cars");
  if (!res.success || !Array.isArray(res.cars)) throw new Error(res.message || "Failed to load your listings");
  return res.cars.map((c) => {
    const imgs = (c.images ?? c.carImage ?? []) as unknown[];
    const first = imgs[0];
    return {
      id: s(c.id),
      title: s(c.title) || "Untitled Car",
      image: typeof first === "string" ? first : s((first as Raw | undefined)?.url),
      ratePerHour: n(c.pricePerHour ?? c.ratePerHour),
      city: s(c.city),
      approval: s(c.carApprovalStatus).toUpperCase() || "PENDING",
      enabled: c.carEnabled === 1 || c.carEnabled === true || c.carEnabled === "1",
      repairMode: c.repairMode === 1 || c.repairMode === true,
      numberPlate: s(c.numberPlate),
    };
  });
}

/** Every reservation (upcoming + completed) for the calendar (host_calendar_repository). */
export async function getAllReservations() {
  const res = await api<{ upcoming?: Raw[]; completed?: Raw[] }>("/host/mybooking");
  const map = (r: Raw, completed: boolean) => ({
    carId: s(r.carId),
    carTitle: s(r.carTitle ?? (r.car as Raw | undefined)?.title),
    start: s(r.startDate),
    end: s(r.endDate),
    status: s(r.status).toUpperCase(),
    completed,
  });
  return [...(res.upcoming ?? []).map((r) => map(r, false)), ...(res.completed ?? []).map((r) => map(r, true))];
}

export type SelfBooking = { id: string; start: string; end: string };

export async function getSelfBookings(carId: string): Promise<SelfBooking[]> {
  try {
    const res = await api<{ data?: Raw[] }>(`/api/booking/self-bookings/${encodeURIComponent(carId)}`);
    return (res.data ?? [])
      .filter((r) => r.id != null && r.startDate && r.endDate)
      .map((r) => ({ id: s(r.id), start: s(r.startDate), end: s(r.endDate) }))
      .sort((a, b) => a.start.localeCompare(b.start));
  } catch {
    return [];
  }
}

export type BankAccount = { id: string; holder: string; accountNumber: string; ifsc: string; bankName: string; branch: string };

export async function getBankAccount(): Promise<BankAccount | null> {
  try {
    const res = await api<{ success?: boolean; bankAccount?: Raw | null }>("/bank/my");
    const b = res.bankAccount;
    if (!b) return null;
    return {
      id: s(b.id ?? b._id),
      holder: s(b.accountHolderName),
      accountNumber: s(b.accountNumber),
      ifsc: s(b.ifscCode),
      bankName: s(b.bankName),
      branch: s(b.branchName),
    };
  } catch {
    return null;
  }
}

export type Transaction = { id: string; carName: string; amount: number; status: string; settlement: string; createdAt: string };

export async function getTransactions(page: number) {
  const res = await api<{ data?: Raw[]; pagination?: { hasNextPage?: boolean } }>("/transaction/host/completed", {
    query: { page, limit: 10 },
  });
  return {
    rows: (res.data ?? []).map((t) => ({
      id: s(t.id),
      carName: s(t.carName),
      amount: n(t.amount),
      status: s(t.status),
      settlement: s(t.settlementStatus),
      createdAt: s(t.createdAt),
    })),
    hasNext: res.pagination?.hasNextPage === true,
  };
}
