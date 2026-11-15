import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RemoveSelfBook, RepairToggle, SelfBookForm } from "@/components/host/CalendarControls";
import { AddCarLink, HostPageHeader } from "@/components/host/HostSections";
import { requireUser } from "@/lib/auth";
import { formatShort } from "@/lib/datetime";
import { getAllReservations, getMyListings, getSelfBookings } from "@/lib/host";

export const metadata: Metadata = { title: "Calendar · Hosting", robots: { index: false } };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const IST = 330 * 60_000;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Request time; this page is per-request (it reads the session) so "now" is fresh. */
const currentTime = () => Date.now();

/** IST calendar day key "YYYY-MM-DD" for an instant. */
const dayKey = (ms: number) => new Date(ms + IST).toISOString().slice(0, 10);

/** Every IST day an interval touches. */
function daysBetween(startIso: string, endIso: string) {
  const out: string[] = [];
  const s = Date.parse(startIso);
  const e = Date.parse(endIso);
  if (!Number.isFinite(s) || !Number.isFinite(e)) return out;
  for (let t = s; dayKey(t) <= dayKey(e - 1) && out.length < 400; t += 86_400_000) out.push(dayKey(t));
  return out;
}

function MonthGrid({
  year,
  month,
  booked,
  blocked,
  todayKey,
}: {
  year: number;
  month: number; // 0-11
  booked: Set<string>;
  blocked: Set<string>;
  todayKey: string;
}) {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <div className="grid grid-cols-7 gap-1.5 text-center text-sm">
      {WEEKDAYS.map((d) => (
        <div key={d} className="py-1 text-xs font-semibold text-muted">
          {d}
        </div>
      ))}
      {cells.map((d, i) => {
        if (d == null) return <div key={`x${i}`} />;
        const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const isBooked = booked.has(key);
        const isBlocked = blocked.has(key);
        const label = isBooked ? "booked" : isBlocked ? "self booked" : "available";
        return (
          <div
            key={key}
            aria-label={`${d}, ${label}`}
            className={`flex aspect-square items-center justify-center rounded-xl font-semibold ${
              isBooked ? "bg-brand text-white" : isBlocked ? "bg-ink text-white" : "bg-surface"
            } ${key < todayKey ? "opacity-40" : ""} ${key === todayKey ? "ring-2 ring-ink ring-offset-1" : ""}`}
          >
            {d}
          </div>
        );
      })}
    </div>
  );
}

async function Calendar({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await requireUser("/host/calendar");
  const [cars, reservations] = await Promise.all([
    getMyListings().catch(() => null),
    getAllReservations().catch(() => []),
  ]);
  const approved = (cars ?? []).filter((c) => c.approval === "APPROVED");

  if (!cars) return <p className="text-muted">Couldn&apos;t load your cars.</p>;
  if (approved.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-line-soft p-6">
        <p className="font-semibold">No approved cars yet.</p>
        <p className="text-sm text-muted">Once a car is approved you can manage its availability here.</p>
        <AddCarLink />
      </div>
    );
  }

  const car = approved.find((c) => c.id === one(sp.car)) ?? approved[0];
  const now = currentTime();
  const todayKey = dayKey(now);
  const [ty, tm] = todayKey.split("-").map(Number);
  const m = /^(\d{4})-(\d{2})$/.exec(one(sp.month));
  const year = m ? Number(m[1]) : ty;
  const month = m ? Number(m[2]) - 1 : tm - 1;
  const ym = (y: number, mo: number) => {
    const d = new Date(Date.UTC(y, mo, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month, 1)),
  );

  const selfBooks = await getSelfBookings(car.id);
  const carRes = reservations.filter((r) => r.carId === car.id && r.status !== "CANCELLED");
  const booked = new Set(carRes.flatMap((r) => daysBetween(r.start, r.end)));
  const blocked = new Set(selfBooks.flatMap((b) => daysBetween(b.start, b.end)));
  const upcomingRes = carRes.filter((r) => Date.parse(r.end) >= now).sort((a, b) => a.start.localeCompare(b.start));
  const href = (extra: Record<string, string>) => `/host/calendar?${new URLSearchParams({ car: car.id, month: ym(year, month), ...extra })}`;

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Cars" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
        {approved.map((c) => (
          <Link
            key={c.id}
            href={`/host/calendar?car=${c.id}&month=${ym(year, month)}`}
            aria-current={c.id === car.id ? "page" : undefined}
            className={`flex-none rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${
              c.id === car.id ? "bg-ink text-white" : "border border-line hover:border-ink"
            }`}
          >
            {c.title}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <section className="flex min-w-0 flex-1 flex-col gap-4 rounded-2xl border border-line-soft p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <Link href={href({ month: ym(year, month - 1) })} aria-label="Previous month" className="flex size-10 items-center justify-center rounded-full border border-line hover:border-ink">
              ‹
            </Link>
            <h2 className="text-xl font-bold">{monthLabel}</h2>
            <Link href={href({ month: ym(year, month + 1) })} aria-label="Next month" className="flex size-10 items-center justify-center rounded-full border border-line hover:border-ink">
              ›
            </Link>
          </div>
          <MonthGrid year={year} month={month} booked={booked} blocked={blocked} todayKey={todayKey} />
          <div className="flex flex-wrap gap-4 text-xs text-ink-3">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-brand" /> Booked by customer</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-ink" /> Self booked</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-surface ring-1 ring-line" /> Available</span>
          </div>
        </section>

        <aside className="flex w-full flex-col gap-5 lg:w-[380px] lg:flex-none">
          <section className="rounded-2xl border border-line-soft p-5">
            <RepairToggle carId={car.id} on={car.repairMode} />
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-line-soft p-5">
            <h2 className="font-bold">Block Dates (Self Book)</h2>
            <p className="text-sm text-muted">Customers can&apos;t book {car.title} during blocked times.</p>
            <SelfBookForm key={car.id} carId={car.id} />
            {selfBooks.length > 0 && (
              <ul className="mt-2 flex flex-col divide-y divide-line-soft">
                {selfBooks.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span>
                      {formatShort(b.start)} – {formatShort(b.end)}
                    </span>
                    <RemoveSelfBook id={b.id} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-2 rounded-2xl border border-line-soft p-5">
            <h2 className="font-bold">Upcoming reservations</h2>
            {upcomingRes.length === 0 ? (
              <p className="text-sm text-muted">No upcoming reservations for this car.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line-soft text-sm">
                {upcomingRes.map((r, i) => (
                  <li key={`${r.start}-${i}`} className="py-2.5">
                    {formatShort(r.start)} – {formatShort(r.end)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function HostCalendarPage({ searchParams }: PageProps<"/host/calendar">) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <HostPageHeader title="Calendar" sub="See when each car is booked, and block dates for your own use." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-placeholder" />}>
        <Calendar searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
