import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BookingsTable, HostPageHeader } from "@/components/host/HostSections";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Booking · Hosting", robots: { index: false } };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Host "Booking" tab (host_booking_screen). */
async function Bookings({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tab = one(sp.tab) === "completed" ? "completed" : "upcoming";
  const page = Math.max(1, Number(one(sp.page)) || 1);
  await requireUser(`/host/bookings?tab=${tab}`);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <HostPageHeader title="Booking" />
      <div className="flex gap-2" role="tablist">
        {(["upcoming", "completed"] as const).map((t) => (
          <Link
            key={t}
            role="tab"
            aria-selected={tab === t}
            href={`/host/bookings?tab=${t}`}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold ${tab === t ? "bg-ink text-white" : "border border-line hover:border-ink"}`}
          >
            {t === "upcoming" ? "Upcoming" : "Completed"}
          </Link>
        ))}
      </div>
      <Suspense key={`${tab}-${page}`} fallback={<div className="h-48 animate-pulse rounded-2xl bg-placeholder" />}>
        <BookingsTable tab={tab} page={page} />
      </Suspense>
    </div>
  );
}

export default function HostBookingsPage({ searchParams }: PageProps<"/host/bookings">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="mx-auto h-96 max-w-7xl px-4 py-8" />}>
      <Bookings searchParams={searchParams} />
    </Suspense>
  );
}
