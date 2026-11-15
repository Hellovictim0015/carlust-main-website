import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AddCarLink, BookingsTable, EarningsCard, HostPageHeader } from "@/components/host/HostSections";
import { Icon, type IconName } from "@/components/Icon";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Today · Hosting", robots: { index: false } };

const prep: { icon: IconName; title: string; body: string; href: string }[] = [
  { icon: "bolt", title: "Turn Instant Book on or off", body: "Choose how customer will book", href: "/host/listings" },
  { icon: "calendar", title: "Set up your calendar", body: "Change which dates are available", href: "/host/calendar" },
  { icon: "car", title: "Vehicle Details", body: "Update car information and photos", href: "/host/listings" },
  { icon: "wallet", title: "Pricing Setup", body: "Set your daily and weekly rates", href: "/host/listings" },
];

/** Host "Today" tab (host_today_screen). */
async function Today() {
  const user = await requireUser("/host");
  const phone = user.phoneNumber ? (user.phoneNumber.startsWith("+") ? user.phoneNumber : `+91 ${user.phoneNumber}`) : "";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 md:px-8 md:py-8 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <HostPageHeader
          title={`Welcome, ${user.name || phone}`}
          sub="Customer can book your Car 24 hours after you publish - here's how to prepare."
          action={<AddCarLink />}
        />

        <section className="flex flex-col gap-4">
          <p className="font-semibold text-brand">
            Confirm important details <span className="text-sm">Required!</span>
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {prep.map((p) => (
              <Link
                key={p.title}
                href={p.href}
                className="flex flex-col items-center gap-2 rounded-2xl border border-line-soft p-4 text-center hover:border-ink"
              >
                <Icon name={p.icon} size={26} />
                <span className="text-sm font-semibold">{p.title}</span>
                <span className="text-xs text-muted">{p.body}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold">Upcoming bookings</h2>
            <Link href="/host/bookings" className="text-sm font-semibold underline">
              See all
            </Link>
          </div>
          <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-placeholder" />}>
            <BookingsTable tab="upcoming" page={1} limit={5} pager={false} />
          </Suspense>
        </section>
      </div>

      <aside className="flex w-full flex-col gap-5 lg:sticky lg:top-6 lg:w-[320px] lg:flex-none">
        <Suspense fallback={<div className="h-44 animate-pulse rounded-2xl bg-placeholder" />}>
          <EarningsCard />
        </Suspense>
      </aside>
    </div>
  );
}

export default function HostTodayPage() {
  return (
    <Suspense fallback={<div aria-busy="true" className="mx-auto h-96 max-w-7xl px-4 py-8" />}>
      <Today />
    </Suspense>
  );
}
