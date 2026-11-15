import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { contactUser } from "@/app/actions/chat";
import { Row } from "@/components/car/PriceRows";
import { Avatar } from "@/components/layout/HeaderAccount";
import { StatusBadge } from "@/components/trips/StatusBadge";
import { CancelBooking, RefundButton, ReviewForm } from "@/components/trips/TripActions";
import { requireUser } from "@/lib/auth";
import { getOrders, getReservation, tripStatus, type BookingRow } from "@/lib/bookings";
import { formatHours, formatShort } from "@/lib/datetime";
import { convenienceFee, formatInr } from "@/lib/pricing";

export const metadata: Metadata = { title: "Trips", robots: { index: false } };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function TripCard({ b, href, active }: { b: BookingRow; href: string; active: boolean }) {
  const st = tripStatus(b.status, b.bookingStarted);
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`flex gap-4 rounded-2xl border p-4 transition-colors ${
        active ? "border-ink shadow-card" : "border-line-soft hover:border-line"
      }`}
    >
      <div className="relative h-24 w-28 flex-none overflow-hidden rounded-xl bg-placeholder sm:w-36">
        {b.image && <Image src={b.image} alt="" fill sizes="144px" className="object-cover" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-bold">{b.carTitle || "Car"}</h2>
            {b.numberPlate && <p className="text-xs text-muted">{b.numberPlate}</p>}
          </div>
          <StatusBadge label={st.label} tone={st.tone} />
        </div>
        <dl className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <dt className="text-muted">Booking Time</dt>
            <dd className="font-semibold">{formatShort(b.startDate)}</dd>
          </div>
          <div>
            <dt className="text-muted">Duration</dt>
            <dd className="font-semibold">{formatHours(Math.round(b.totalHours))}</dd>
          </div>
          <div>
            <dt className="text-muted">Amount</dt>
            <dd className="font-semibold">{formatInr(b.amount)}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}

async function Detail({ id, verified, back }: { id: string; verified: boolean; back: string }) {
  const r = await getReservation(id).catch(() => null);
  if (!r) return <p className="rounded-2xl border border-line-soft p-6 text-muted">This booking couldn&apos;t be loaded.</p>;

  const st = tripStatus(r.status, r.bookingStarted);
  const kycPending = !(r.customerVerified ?? verified);
  const canCancel =
    !kycPending &&
    r.status !== "COMPLETED" &&
    r.status !== "CANCELLED" &&
    (!r.bookingStarted || r.bookingStarted === "NOT_STARTED");
  const canReview = r.status === "COMPLETED" && r.userRating == null && r.carId;
  const canRefund = kycPending && !r.refund && (r.status === "CONFIRMED" || r.status === "PENDING");
  const base = Math.round(r.pricePerHour * r.totalHours);
  const fee = convenienceFee(r.totalHours);
  const hostHidden = r.hostDetailsHidden || kycPending;
  const contact = contactUser.bind(null, r.hostId, `/trips?id=${r.id}`, "/messages");

  const refundCopy =
    r.refund?.status === "REFUNDED"
      ? { t: "Refund processed", d: "Your refund has been processed. It can take 5–7 working days to reach your account.", c: "bg-[#e8f5e9] text-[#2e7d32]" }
      : r.refund?.status === "REJECTED"
        ? { t: "Refund not approved", d: r.refund.adminNote || "Please contact support for details.", c: "bg-[#ffebee] text-[#c62828]" }
        : { t: "Refund requested", d: "This booking was cancelled. Your refund is being reviewed by our team.", c: "bg-[#e3f2fd] text-[#1565c0]" };

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line-soft p-5 md:p-6">
      <Link href={back} scroll={false} className="text-sm font-semibold underline lg:hidden">
        ← Back to trips
      </Link>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Booking Details</h2>
        <StatusBadge label={st.label} tone={st.tone} />
      </div>
      <p className="font-semibold">
        {r.carTitle} {r.numberPlate && <span className="text-sm font-normal text-muted">· {r.numberPlate}</span>}
      </p>

      {r.refund && (
        <div className={`rounded-xl p-4 ${refundCopy.c}`}>
          <p className="font-semibold">{refundCopy.t}</p>
          <p className="text-sm">{refundCopy.d}</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted">Booking ID</dt>
          <dd className="font-semibold break-all">{r.id}</dd>
        </div>
        <div>
          <dt className="text-muted">Payment ID</dt>
          <dd className="font-semibold break-all">{r.paymentId || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Scheduled Start</dt>
          <dd className="font-semibold">{formatShort(r.startDate)}</dd>
        </div>
        <div>
          <dt className="text-muted">Scheduled End</dt>
          <dd className="font-semibold">{formatShort(r.endDate)}</dd>
        </div>
        {r.userLocation && (
          <div className="col-span-2">
            <dt className="text-muted">Delivery address</dt>
            <dd className="font-semibold">{r.userLocation}</dd>
          </div>
        )}
      </dl>

      <div className="flex flex-col gap-2 rounded-xl bg-surface p-4">
        <p className="mb-1 text-sm font-semibold">Payment Details</p>
        <Row label={`Base Fare (${formatHours(Math.round(r.totalHours))})`} value={formatInr(base)} />
        <Row label="Convenience fee" value={formatInr(fee)} />
        {r.doorstepAmount > 0 && <Row label={`Doorstep delivery (${r.doorstepDistance} km)`} value={formatInr(r.doorstepAmount)} />}
        {r.couponCode && <Row label="Coupon" value={r.couponCode} />}
        <Row label="Security deposit (refundable)" value={formatInr(r.securityDeposit)} />
        <div className="my-1 border-t border-line" />
        <Row label="Total paid (incl. GST 18%)" value={formatInr(r.amount)} strong />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">Host Details</p>
        {hostHidden ? (
          <p className="text-sm text-muted">Host details will be shown once your verification is approved.</p>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar name={r.hostName} image={r.hostProfilePic || null} size={44} />
            <div>
              <p className="font-semibold">{r.hostName}</p>
              {r.hostPhone && (
                <a href={`tel:${r.hostPhone}`} className="text-sm text-brand-link underline">
                  {r.hostPhone}
                </a>
              )}
            </div>
          </div>
        )}
        {!hostHidden && r.hostId && (
          <form action={contact}>
            <button className="h-12 w-full rounded-[14px] border border-ink font-semibold hover:bg-surface">Contact Host</button>
          </form>
        )}
      </div>

      {kycPending && !r.refund && r.status !== "CANCELLED" && (
        <Link href="/profile?tab=documents" className="h-12 rounded-[14px] bg-[#0052cc] text-center leading-[48px] font-semibold text-white">
          Verify Now
        </Link>
      )}
      {canCancel && <CancelBooking bookingId={r.id} />}
      {canRefund && <RefundButton bookingId={r.id} />}
      {canReview && <ReviewForm carId={r.carId} />}
    </div>
  );
}

async function Trips({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tab = one(sp.tab) === "completed" ? "completed" : "upcoming";
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const id = one(sp.id);
  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ tab, ...(page > 1 ? { page: String(page) } : {}), ...extra });
    return `/trips?${p}`;
  };
  const user = await requireUser(qs(id ? { id } : {}));
  const data = await getOrders(tab, page).catch(() => null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-[32px] font-extrabold tracking-[-.6px]">Trips</h1>

      {one(sp.booked) === "1" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#e8ffe6] p-4">
          <p>
            <b>Booking Confirmed!</b>
            {!user.isVerified && " Verify your account to start your trip"}
          </p>
          {!user.isVerified && (
            <Link href="/profile?tab=documents" className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">
              Verify Now
            </Link>
          )}
        </div>
      )}

      <div className="mt-5 mb-6 flex gap-2" role="tablist">
        {(["upcoming", "completed"] as const).map((t) => (
          <Link
            key={t}
            role="tab"
            aria-selected={tab === t}
            href={`/trips?tab=${t}`}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold ${
              tab === t ? "bg-ink text-white" : "border border-line hover:border-ink"
            }`}
          >
            {t === "upcoming" ? "Upcoming" : "Completed"}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className={`flex min-w-0 flex-1 flex-col gap-4 ${id ? "hidden lg:flex" : ""}`}>
          {data === null ? (
            <p className="rounded-2xl border border-line-soft p-6 text-muted">We couldn&apos;t load your trips. Please refresh.</p>
          ) : data.rows.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-line-soft p-8">
              <p className="text-lg font-bold">{tab === "upcoming" ? "No upcoming trips" : "No completed trips yet"}</p>
              <p className="text-muted">Time to dust off your bags and start planning your next adventure.</p>
              <Link href="/explore" className="rounded-[14px] bg-brand px-5 py-3 font-semibold text-white">
                Find your dream car
              </Link>
            </div>
          ) : (
            <>
              {data.rows.map((b) => (
                <TripCard key={b.id} b={b} href={qs({ id: b.id })} active={b.id === id} />
              ))}
              <div className="flex justify-between">
                {page > 1 ? (
                  <Link href={`/trips?tab=${tab}&page=${page - 1}`} className="font-semibold underline">
                    ← Newer
                  </Link>
                ) : (
                  <span />
                )}
                {data.hasNext && (
                  <Link href={`/trips?tab=${tab}&page=${page + 1}`} className="font-semibold underline">
                    Older →
                  </Link>
                )}
              </div>
            </>
          )}
        </div>

        <aside aria-label="Booking Details" className={`w-full lg:sticky lg:top-6 lg:w-[420px] lg:flex-none ${id ? "" : "hidden lg:block"}`}>
          {id ? (
            <Suspense key={id} fallback={<div className="h-96 animate-pulse rounded-2xl bg-placeholder" />}>
              <Detail id={id} verified={user.isVerified} back={qs({})} />
            </Suspense>
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">
              Select a trip to see its booking details.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function TripsPage({ searchParams }: PageProps<"/trips">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="mx-auto h-96 max-w-7xl animate-pulse px-4 py-8 md:px-8" />}>
      <Trips searchParams={searchParams} />
    </Suspense>
  );
}
