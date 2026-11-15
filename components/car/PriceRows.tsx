import type { ReactNode } from "react";
import { formatHours } from "@/lib/datetime";
import { DOORSTEP_PER_KM, formatInr, type Breakdown } from "@/lib/pricing";

export function Row({ label, value, strong = false }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-base font-bold" : "text-sm"}`}>
      <span className={strong ? "" : "text-ink-3"}>{label}</span>
      <span className="font-semibold whitespace-nowrap">{value}</span>
    </div>
  );
}

/** Full checkout breakdown (design: checkout "Price Breakdown"). */
export function PriceRows({ b, doorstepKm, detailed = true }: { b: Breakdown; doorstepKm: number | null; detailed?: boolean }) {
  return (
    <div className="flex flex-col gap-2.5">
      <Row label={`Base Fare (${formatHours(Math.round(b.hours * 10) / 10)})`} value={formatInr(b.tripAmount)} />
      <Row label="Convenience Fee" value={formatInr(b.convenienceFee)} />
      {doorstepKm != null && (
        <>
          <Row label="Doorstep Fixed Fee" value={formatInr(b.doorstepFixed)} />
          <Row
            label={`Doorstep Distance Fee (${doorstepKm} km × ₹${DOORSTEP_PER_KM})`}
            value={formatInr(b.doorstepDistanceFee)}
          />
          {detailed && <Row label="Total Doorstep Fee" value={formatInr(b.totalDoorstep)} />}
        </>
      )}
      {detailed && <Row label="Subtotal Before Coupon" value={formatInr(b.taxable)} />}
      {b.couponDiscount > 0 && (
        <Row label="Coupon Discount" value={<span className="text-success">− {formatInr(b.couponDiscount)}</span>} />
      )}
      {detailed && <Row label="Taxable Amount (Before GST)" value={formatInr(b.taxable - b.couponDiscount)} />}
      <Row label="GST (18%)" value={formatInr(b.gst)} />
      <Row label="Security Deposit (refundable)" value={formatInr(b.securityDeposit)} />
      <div className="my-1 border-t border-line-soft" />
      <Row label={detailed ? "Final Payable Amount" : "Total"} value={formatInr(b.finalAmount)} strong />
    </div>
  );
}
