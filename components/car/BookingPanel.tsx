"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { defaultStart, istLocalToMs, msToIstLocal } from "@/lib/datetime";
import { billableHours, DOORSTEP_FIXED, DOORSTEP_PER_KM, formatInr, MIN_HOURS, priceBreakdown } from "@/lib/pricing";
import { PriceRows } from "./PriceRows";
import { TripTimes } from "./TripTimes";

type Props = {
  carId: string;
  ratePerHour: number;
  securityDeposit: number;
  doorstepAvailable: boolean;
  bookable: boolean;
  initialStart?: string;
  initialEnd?: string;
};

/** Sticky "Book this car" panel from the details design. */
export function BookingPanel({
  carId,
  ratePerHour,
  securityDeposit,
  doorstepAvailable,
  bookable,
  initialStart,
  initialEnd,
}: Props) {
  const router = useRouter();
  const [start, setStart] = useState(() => initialStart || defaultStart());
  const [end, setEnd] = useState(
    () => initialEnd || msToIstLocal(istLocalToMs(initialStart || defaultStart()) + 12 * 3_600_000),
  );
  const [doorstep, setDoorstep] = useState(false);
  const [now] = useState(() => Date.now());

  const startMs = istLocalToMs(start);
  const endMs = istLocalToMs(end);
  const valid = Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs && startMs > now - 5 * 60_000;
  const hours = valid ? billableHours(startMs, endMs) : MIN_HOURS;
  // Doorstep distance is set at checkout; show the fixed part here.
  const b = priceBreakdown({ ratePerHour, hours, securityDeposit, doorstepKm: doorstep ? 0 : null });

  function onContinue() {
    const qs = new URLSearchParams({ start, end });
    if (doorstep) qs.set("delivery", "1");
    router.push(`/checkout/${carId}?${qs}`);
  }

  return (
    <aside
      aria-label="Book this car"
      className="flex flex-col gap-5 rounded-2xl border border-line-soft bg-white p-6 shadow-[0_6px_24px_rgba(0,0,0,.08)]"
    >
      <p>
        <span className="text-[26px] font-extrabold">{formatInr(ratePerHour)}</span>
        <span className="text-muted"> /hr</span>
      </p>

      <TripTimes
        compact
        start={start}
        end={end}
        onChange={(s, e) => {
          setStart(s);
          setEnd(e);
        }}
      />

      {doorstepAvailable && (
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line" role="group" aria-label="Pick up or delivery">
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
      )}
      {doorstep && (
        <p className="-mt-2 text-xs text-muted">
          Car At Your Doorstep — {formatInr(DOORSTEP_FIXED)} fixed + ₹{DOORSTEP_PER_KM} per km. You&apos;ll add your
          address at checkout.
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-xl bg-surface p-4">
        <p className="text-xs font-bold tracking-[.6px] text-ink-3">PRICE BREAKUP</p>
        <PriceRows b={b} doorstepKm={null} detailed={false} />
        {doorstep && <p className="text-xs text-muted">+ doorstep delivery fee, shown at checkout</p>}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!bookable || !valid}
        className="h-[52px] rounded-[14px] bg-brand text-base font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
      >
        {bookable ? "Continue" : "Not available right now"}
      </button>
      <p className="-mt-2 text-center text-xs text-muted">Trip Amount (not including fuel)</p>
    </aside>
  );
}
