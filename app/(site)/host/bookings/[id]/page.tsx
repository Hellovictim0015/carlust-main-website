import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { contactUser } from "@/app/actions/chat";
import { Row } from "@/components/car/PriceRows";
import { TripPhotosForm } from "@/components/host/HostControls";
import { StatusBadge } from "@/components/trips/StatusBadge";
import { requireUser } from "@/lib/auth";
import { getReservation, tripStatus } from "@/lib/bookings";
import { formatHours, formatShort } from "@/lib/datetime";
import { convenienceFee, formatInr } from "@/lib/pricing";

export const metadata: Metadata = { title: "Booking Details", robots: { index: false } };

function Photos({ title, urls }: { title: string; urls: string[] }) {
  if (urls.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{title}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {urls.map((u) => (
          <a key={u} href={u} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-lg bg-placeholder">
            <Image src={u} alt="" fill unoptimized className="object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
}

async function HostBooking({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/host/bookings/${id}`);
  const r = await getReservation(id).catch(() => null);
  if (!r) return <p className="text-muted">This booking couldn&apos;t be loaded.</p>;

  const st = tripStatus(r.status, r.bookingStarted);
  const kycPending = r.customerDetailsHidden || r.customerVerified === false;
  const canStart = !kycPending && r.pickupPhotos.length === 0 && !["START", "COMPLETED", "CANCELLED"].includes(r.status);
  const canComplete = r.dropPhotos.length === 0 && r.status !== "COMPLETED" && r.status !== "CANCELLED" && (r.pickupPhotos.length > 0 || r.status === "START");
  const base = Math.round(r.pricePerHour * r.totalHours);
  const fee = convenienceFee(r.totalHours);
  const taxable = base + fee + r.doorstepAmount;
  const contact = contactUser.bind(null, r.userId, `/host/bookings/${r.id}`, "/host/messages");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-extrabold">Booking Details</h1>
        <StatusBadge label={st.label} tone={st.tone} />
      </div>
      <p className="font-semibold">
        {r.carTitle} {r.numberPlate && <span className="font-normal text-muted">· {r.numberPlate}</span>}
      </p>

      <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-line-soft p-5 text-sm sm:grid-cols-4">
        <div><dt className="text-muted">Scheduled Start</dt><dd className="font-semibold">{formatShort(r.startDate)}</dd></div>
        <div><dt className="text-muted">Scheduled End</dt><dd className="font-semibold">{formatShort(r.endDate)}</dd></div>
        <div><dt className="text-muted">Duration</dt><dd className="font-semibold">{formatHours(Math.round(r.totalHours))}</dd></div>
        <div><dt className="text-muted">Booking ID</dt><dd className="font-semibold break-all">{r.id}</dd></div>
        {r.userLocation && (
          <div className="col-span-2 sm:col-span-4"><dt className="text-muted">Doorstep delivery address</dt><dd className="font-semibold">{r.userLocation} ({r.doorstepDistance} km)</dd></div>
        )}
      </dl>

      <section className="flex flex-col gap-3 rounded-2xl border border-line-soft p-5">
        <h2 className="font-bold">Customer</h2>
        {kycPending ? (
          <p className="text-sm text-muted">Customer details will be shown once their identity verification is approved.</p>
        ) : (
          <>
            <p className="font-semibold">{r.customerName || "Customer"}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              {r.customerPhone && <a href={`tel:${r.customerPhone}`} className="text-brand-link underline">{r.customerPhone}</a>}
              {r.customerEmail && <a href={`mailto:${r.customerEmail}`} className="text-brand-link underline">{r.customerEmail}</a>}
            </div>
            {r.userId && (
              <form action={contact}>
                <button className="h-11 rounded-xl border border-ink px-5 font-semibold hover:bg-surface">Message customer</button>
              </form>
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-surface p-5">
        <h2 className="mb-1 font-bold">Payment</h2>
        <Row label="Trip amount" value={formatInr(base)} />
        <Row label="Convenience fee" value={formatInr(fee)} />
        {r.doorstepAmount > 0 && <Row label="Doorstep delivery" value={formatInr(r.doorstepAmount)} />}
        <Row label="GST (18%)" value={formatInr(Math.round(taxable * 0.18))} />
        <Row label="Security deposit" value={formatInr(r.securityDeposit)} />
        <div className="my-1 border-t border-line" />
        <Row label="Total paid by customer" value={formatInr(r.amount)} strong />
      </section>

      <Photos title="Pickup photos" urls={r.pickupPhotos} />
      <Photos title="Drop photos" urls={r.dropPhotos} />
      {canStart && <TripPhotosForm bookingId={r.id} kind="start" />}
      {canComplete && <TripPhotosForm bookingId={r.id} kind="complete" />}
    </div>
  );
}

export default function Page({ params }: PageProps<"/host/bookings/[id]">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <Link href="/host/bookings" className="mb-4 inline-block text-sm font-semibold underline">← Back to bookings</Link>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-placeholder" />}>
        <HostBooking params={params} />
      </Suspense>
    </div>
  );
}
