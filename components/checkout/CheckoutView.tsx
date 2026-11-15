"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { createOrder, listCoupons, verifyPayment, type OrderInput } from "@/app/actions/checkout";
import { updateProfile, type FormState } from "@/app/actions/profile";
import type { CarDetail } from "@/lib/api";
import { formatHours, formatLong, istLocalToMs } from "@/lib/datetime";
import {
  billableHours,
  couponDiscount,
  describeCoupon,
  DOORSTEP_FIXED,
  DOORSTEP_PER_KM,
  formatInr,
  isCouponActive,
  priceBreakdown,
  distanceKm,
  type Coupon,
} from "@/lib/pricing";
import { Icon } from "../Icon";
import { PriceRows } from "../car/PriceRows";
import { TripTimes } from "../car/TripTimes";

type RazorpayResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: (r: unknown) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line-soft p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ProfileForm({ name, email, onDone }: { name: string; email: string; onDone: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl bg-brand-soft p-4">
      <p className="font-semibold">Complete your profile to pay</p>
      <input name="name" defaultValue={name} placeholder="Full name" required className="rounded-xl border border-line bg-white px-3 py-2.5" />
      <input name="email" type="email" defaultValue={email} placeholder="Email" required className="rounded-xl border border-line bg-white px-3 py-2.5" />
      {state.error && <p className="text-sm font-semibold text-error">{state.error}</p>}
      <button disabled={pending} className="h-11 rounded-xl bg-ink font-semibold text-white disabled:opacity-60">
        {pending ? "Saving…" : "Save and continue"}
      </button>
    </form>
  );
}

export function CheckoutView({
  car,
  initialStart,
  initialEnd,
  initialDelivery,
  user,
}: {
  car: CarDetail;
  initialStart: string;
  initialEnd: string;
  initialDelivery: boolean;
  user: { name: string; email: string; isVerified: boolean };
}) {
  const router = useRouter();
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [editingTrip, setEditingTrip] = useState(false);
  const [doorstep, setDoorstep] = useState(initialDelivery && car.doorstepAvailable);
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [km, setKm] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [applied, setApplied] = useState<Coupon | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [needProfile, setNeedProfile] = useState(!user.name || !user.email);
  const [stage, setStage] = useState<"idle" | "paying" | "verifying" | "done">("idle");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    listCoupons().then(setCoupons);
  }, []);

  const startMs = istLocalToMs(start);
  const endMs = istLocalToMs(end);
  const timesValid = Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
  const hours = timesValid ? billableHours(startMs, endMs) : 8;
  const doorstepKm = doorstep ? (km ?? 0) : null;
  const base = priceBreakdown({ ratePerHour: car.ratePerHour, hours, securityDeposit: car.securityDeposit, doorstepKm });
  // Drop the coupon if the booking no longer qualifies (app: _dropCouponIfNoLongerValid).
  const couponOk = applied && isCouponActive(applied) && base.taxable >= applied.minAmount;
  const b = priceBreakdown({
    ratePerHour: car.ratePerHour,
    hours,
    securityDeposit: car.securityDeposit,
    doorstepKm,
    coupon: couponOk ? applied : null,
  });

  function locateMe() {
    if (!navigator.geolocation) return setMessage({ kind: "error", text: "Location isn't available in this browser." });
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(here);
        if (car.lat != null && car.lng != null) {
          setKm(Math.max(1, Math.ceil(distanceKm(here, { lat: car.lat, lng: car.lng }))));
        }
        if (!address) setAddress("Near my current location");
        setLocating(false);
      },
      () => {
        setLocating(false);
        setMessage({ kind: "error", text: "We couldn't get your location. Enter the distance manually." });
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function applyCode(c: Coupon | undefined) {
    if (!c) return setMessage({ kind: "error", text: "That coupon code isn't valid." });
    if (base.taxable < c.minAmount) {
      return setMessage({ kind: "error", text: `${c.code} needs a booking of at least ${formatInr(c.minAmount)}.` });
    }
    setApplied(c);
    setMessage({ kind: "info", text: `Coupon ${c.code} applied! You save ${formatInr(couponDiscount(c, base.taxable, hours))}.` });
  }

  function pay() {
    setMessage(null);
    if (!timesValid) return setMessage({ kind: "error", text: "Please choose a valid start and end time." });
    if (doorstep && (!address.trim() || km == null)) {
      return setMessage({ kind: "error", text: "Add your delivery address and distance for doorstep delivery." });
    }
    const input: OrderInput = {
      carId: car.id,
      start,
      end,
      doorstepKm,
      address: doorstep ? address.trim() : "",
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      couponCode: couponOk ? applied!.code : null,
    };
    startTransition(async () => {
      const order = await createOrder(input);
      if (!order.ok) {
        if (order.needProfile) setNeedProfile(true);
        return setMessage({ kind: "error", text: order.error });
      }
      if (!(await loadRazorpay()) || !window.Razorpay) {
        return setMessage({ kind: "error", text: "Couldn't load the payment window. Check your connection and try again." });
      }
      setStage("paying");
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Carlust Automotive Private Limited",
        description: "Carlust Self Drive Rental",
        prefill: order.prefill,
        theme: { color: "#DF4058" },
        modal: { ondismiss: () => setStage("idle") },
        handler: async (r: RazorpayResponse) => {
          setStage("verifying");
          const res = await verifyPayment({ ...input, ...r });
          if (!res.ok) {
            setStage("idle");
            return setMessage({ kind: "error", text: `${res.error} If money was deducted, contact support with payment ID ${r.razorpay_payment_id}.` });
          }
          setStage("done");
          router.replace(res.verified ? "/trips?booked=1" : "/trips?booked=1&verify=1");
        },
      });
      rzp.on("payment.failed", () => {
        setStage("idle");
        setMessage({ kind: "error", text: "Payment was cancelled or failed. Please try again." });
      });
      rzp.open();
    });
  }

  if (stage === "verifying" || stage === "done") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center" role="status">
        <span className="size-12 animate-spin rounded-full border-4 border-brand-soft border-t-brand" />
        <p className="text-xl font-bold">{stage === "done" ? "Booking Confirmed!" : "Processing payment verification…"}</p>
        <p className="text-muted">Please don&apos;t close this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/cars/${car.id}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`}
          aria-label="Back"
          className="flex size-10 items-center justify-center rounded-full border border-line hover:bg-surface"
        >
          <span className="rotate-180">
            <Icon name="chevronRight" size={18} />
          </span>
        </Link>
        <h1 className="text-[28px] font-extrabold">CheckOut</h1>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <section className="flex gap-4 rounded-2xl border border-line-soft p-4">
            <div className="relative h-24 w-32 flex-none overflow-hidden rounded-xl bg-placeholder">
              {car.images[0] && <Image src={car.images[0]} alt="" fill sizes="128px" className="object-cover" />}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{car.title}</h2>
              <p className="text-sm text-muted">
                {[car.numberPlate, car.transmission, car.fuel, `${car.seats} Seats`].filter(Boolean).join(" • ")}
              </p>
              <p className="mt-1 text-sm">
                {car.reviews > 0 && <b>{car.rating.toFixed(1)} · </b>}Hosted by {car.hostName || "Carlust host"}
              </p>
            </div>
          </section>

          <Card
            title="Your Trip"
            action={
              <button type="button" onClick={() => setEditingTrip((v) => !v)} className="text-sm font-semibold underline">
                {editingTrip ? "Done" : "Edit"}
              </button>
            }
          >
            {editingTrip ? (
              <TripTimes
                start={start}
                end={end}
                onChange={(s, e) => {
                  setStart(s);
                  setEnd(e);
                }}
              />
            ) : (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-muted">Start Date Time</dt>
                  <dd className="font-semibold">{formatLong(startMs)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">End Date Time</dt>
                  <dd className="font-semibold">{formatLong(endMs)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Duration</dt>
                  <dd className="font-semibold">{formatHours(Math.round(hours * 10) / 10)}</dd>
                </div>
              </dl>
            )}
          </Card>

          {car.doorstepAvailable && (
            <Card title="Pick Up & Drop Off">
              <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line">
                {[false, true].map((d) => (
                  <button
                    key={String(d)}
                    type="button"
                    aria-pressed={doorstep === d}
                    onClick={() => setDoorstep(d)}
                    className={`px-2 py-3 text-sm font-semibold ${d ? "border-l border-line" : ""} ${
                      doorstep === d ? "bg-ink text-white" : "hover:bg-surface"
                    }`}
                  >
                    {d ? "Doorstep delivery" : "Pick Up Myself"}
                  </button>
                ))}
              </div>
              {doorstep ? (
                <div className="flex flex-col gap-3 rounded-xl bg-surface p-4">
                  <p className="text-sm font-semibold">
                    Doorstep Delivery Selected — {formatInr(DOORSTEP_FIXED)} fixed + ₹{DOORSTEP_PER_KM}/km
                  </p>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-ink-3">Delivery address</span>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      placeholder="House no., street, area, city"
                      className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-ink"
                    />
                  </label>
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="text-ink-3">Distance from car (km)</span>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={km ?? ""}
                        onChange={(e) => setKm(e.target.value === "" ? null : Math.max(0, Math.ceil(Number(e.target.value))))}
                        className="w-28 rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-ink"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={locateMe}
                      disabled={locating}
                      className="flex items-center gap-2 rounded-xl border border-ink bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                    >
                      <Icon name="pin" size={16} />
                      {locating ? "Locating…" : "Use my current location"}
                    </button>
                  </div>
                  <p className="text-xs text-muted">
                    Distance is measured from the car&apos;s location ({car.city}). The host may confirm it before delivery.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted">You&apos;ll pick up the car from the host in {car.city}.</p>
              )}
            </Card>
          )}

          <Card title="Apply Coupon">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyCode(coupons?.find((c) => c.code.toLowerCase() === code.trim().toLowerCase()));
              }}
              className="flex gap-2"
            >
              <label className="sr-only" htmlFor="coupon">
                Coupon code
              </label>
              <input
                id="coupon"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2.5 outline-none focus:border-ink"
              />
              <button className="rounded-xl bg-ink px-5 font-semibold text-white">Apply</button>
            </form>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">Available Coupons</p>
              {coupons === null ? (
                <p className="text-sm text-muted">Loading coupons…</p>
              ) : coupons.length === 0 ? (
                <p className="text-sm text-muted">No coupons available right now.</p>
              ) : (
                coupons.map((c) => {
                  const on = couponOk && applied?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border border-dashed p-3 ${
                        on ? "border-brand bg-brand-soft" : "border-line"
                      }`}
                    >
                      <div>
                        <p className="font-bold tracking-wide">{c.code}</p>
                        <p className="text-xs text-muted">{describeCoupon(c)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => (on ? setApplied(null) : applyCode(c))}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${on ? "bg-brand text-white" : "border border-ink"}`}
                      >
                        {on ? "REMOVE" : "APPLY"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {!user.isVerified && (
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#e6f2ff] p-5">
              <div>
                <p className="font-semibold text-[#0052cc]">Verify your account to start the trip</p>
                <p className="text-sm text-ink-3">
                  Upload your driving license and Aadhar card. You can do this after payment too.
                </p>
              </div>
              <Link href="/profile?tab=documents" className="rounded-xl bg-[#0052cc] px-4 py-2.5 text-sm font-semibold text-white">
                Verify Now
              </Link>
            </section>
          )}
        </div>

        <aside
          aria-label="Price Breakdown"
          className="flex w-full flex-col gap-4 rounded-2xl border border-line-soft p-6 shadow-[0_6px_24px_rgba(0,0,0,.08)] lg:sticky lg:top-6 lg:w-[400px] lg:flex-none"
        >
          <h2 className="text-xl font-bold">Price Breakdown</h2>
          <PriceRows b={b} doorstepKm={doorstepKm} />
          {needProfile && <ProfileForm name={user.name} email={user.email} onDone={() => setNeedProfile(false)} />}
          {message && (
            <p
              role={message.kind === "error" ? "alert" : "status"}
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                message.kind === "error" ? "bg-[#ffe6e6] text-[#c62828]" : "bg-[#e8ffe6] text-[#1f7a44]"
              }`}
            >
              {message.text}
            </p>
          )}
          <button
            type="button"
            onClick={pay}
            disabled={pending || stage === "paying" || needProfile || !timesValid}
            className="h-[52px] rounded-[14px] bg-brand text-base font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
          >
            {pending ? "Preparing payment…" : stage === "paying" ? "Waiting for payment…" : `Proceed to Pay ${formatInr(b.finalAmount)}`}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <Icon name="shield" size={14} /> Secure payment via Razorpay
          </p>
        </aside>
      </div>
    </div>
  );
}
