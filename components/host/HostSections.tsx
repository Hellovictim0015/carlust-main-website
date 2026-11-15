import Image from "next/image";
import Link from "next/link";
import { tripStatus } from "@/lib/bookings";
import { formatHours, formatShort } from "@/lib/datetime";
import { getBankAccount, getHostBookings, getMyListings, getTransactions } from "@/lib/host";
import { formatInr } from "@/lib/pricing";
import { StatusBadge, type Tone } from "../trips/StatusBadge";
import { DeleteCarButton, EnableToggle } from "./HostControls";

export function HostPageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[30px] font-extrabold tracking-[-.6px]">{title}</h1>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export const AddCarLink = () => (
  <Link href="/host/listings/new" className="rounded-[14px] bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-deep">
    Add Car
  </Link>
);

/** Reservations table (design: host dashboard "Booking"). */
export async function BookingsTable({
  tab,
  page,
  limit,
  pager = true,
}: {
  tab: "upcoming" | "completed";
  page: number;
  limit?: number;
  pager?: boolean;
}) {
  const data = await getHostBookings(tab, page).catch(() => null);
  if (!data) return <p className="text-muted">Couldn&apos;t load your bookings.</p>;
  const rows = limit ? data.rows.slice(0, limit) : data.rows;
  if (rows.length === 0) return <p className="rounded-2xl border border-line-soft p-6 text-muted">No {tab} bookings found.</p>;
  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-line-soft">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface text-xs text-ink-3">
            <tr>
              {["Reservation", "Customer", "Scheduled Start", "Duration", "Amount", "Status"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const st = b.selfBook ? ({ label: "Self Booked", tone: "neutral" } as const) : tripStatus(b.status, b.bookingStarted);
              return (
                <tr key={b.id} className="border-t border-line-soft hover:bg-surface">
                  <td className="px-4 py-3">
                    <Link href={`/host/bookings/${b.id}`} className="font-semibold hover:underline">
                      {b.carTitle || "Car"}
                    </Link>
                    {b.numberPlate && <span className="block text-xs text-muted">{b.numberPlate}</span>}
                  </td>
                  <td className="px-4 py-3">{b.selfBook ? "Self Booked" : b.customerName || "—"}</td>
                  <td className="px-4 py-3">{formatShort(b.startDate)}</td>
                  <td className="px-4 py-3">{formatHours(Math.round(b.totalHours))}</td>
                  <td className="px-4 py-3 font-semibold">{b.selfBook ? "—" : formatInr(b.amount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={st.label} tone={st.tone} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pager && (
        <div className="flex justify-between text-sm">
          {page > 1 ? (
            <Link href={`/host/bookings?tab=${tab}&page=${page - 1}`} className="font-semibold underline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          {data.hasNext && (
            <Link href={`/host/bookings?tab=${tab}&page=${page + 1}`} className="font-semibold underline">
              Older →
            </Link>
          )}
        </div>
      )}
    </>
  );
}

const approvalTone = (a: string): Tone => (a === "APPROVED" ? "completed" : a === "REJECTED" ? "cancelled" : "ongoing");

/** Host's cars with enable switch (design: "My Listings"). */
export async function ListingsGrid() {
  const cars = await getMyListings().catch(() => null);
  if (!cars) return <p className="text-muted">Couldn&apos;t load your listings.</p>;
  if (cars.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-line-soft p-6">
        <p className="font-semibold">Add your first car to start earning.</p>
        <AddCarLink />
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cars.map((c) => (
        <article key={c.id} className="flex gap-4 rounded-2xl border border-line-soft p-4">
          <div className="relative h-24 w-28 flex-none overflow-hidden rounded-xl bg-placeholder">
            {c.image && <Image src={c.image} alt="" fill sizes="112px" className="object-cover" />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-bold">{c.title}</h3>
              <StatusBadge label={c.approval} tone={approvalTone(c.approval)} />
            </div>
            <p className="text-sm text-muted">
              {c.approval === "APPROVED" ? `${formatInr(c.ratePerHour)} /hr • ${c.city}` : "Car Pending Approval"}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-4">
              {c.approval === "APPROVED" && <EnableToggle carId={c.id} enabled={c.enabled} />}
              {c.approval === "APPROVED" && (
                <Link href={`/cars/${c.id}`} className="text-sm font-semibold underline">
                  View
                </Link>
              )}
              <DeleteCarButton carId={c.id} title={c.title} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export async function EarningsCard() {
  const [tx, bank] = await Promise.all([getTransactions(1).catch(() => null), getBankAccount()]);
  const total = tx?.rows.reduce((s, t) => s + t.amount, 0) ?? 0;
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-ink p-6 text-white">
      <p className="text-sm text-night-text">Payment &amp; Payouts</p>
      <p className="text-3xl font-extrabold">{formatInr(total)}</p>
      <p className="text-xs text-night-text">From your latest completed transactions</p>
      {!bank && <p className="mt-2 rounded-xl bg-white/10 p-3 text-sm">Add a bank account to receive payouts.</p>}
      <Link href="/host/payments" className="mt-2 font-semibold text-brand-tint underline">
        Transaction History
      </Link>
    </section>
  );
}
