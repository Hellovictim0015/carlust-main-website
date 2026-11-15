"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelBooking, requestRefund, submitReview } from "@/app/actions/trips";
import { Icon } from "../Icon";

const REASONS = [
  "Change of plans",
  "Found a better option",
  "Emergency situation",
  "Weather concerns",
  "Vehicle not needed anymore",
  "Other (specify)",
];

function Feedback({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p
      role={msg.ok ? "status" : "alert"}
      className={`rounded-xl px-3 py-2 text-sm font-semibold ${msg.ok ? "bg-[#e8ffe6] text-[#1f7a44]" : "bg-[#ffe6e6] text-[#c62828]"}`}
    >
      {msg.text}
    </p>
  );
}

export function CancelBooking({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [other, setOther] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-12 rounded-[14px] border border-[#c62828] font-semibold text-[#c62828] hover:bg-[#ffe6e6]"
      >
        Cancel Booking
      </button>
    );
  }
  const final = reason === "Other (specify)" ? other : reason;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line-soft p-4">
      <p className="font-semibold">Why are you cancelling?</p>
      {REASONS.map((r) => (
        <label key={r} className="flex items-center gap-2 text-sm">
          <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-brand" />
          {r}
        </label>
      ))}
      {reason === "Other (specify)" && (
        <textarea
          value={other}
          onChange={(e) => setOther(e.target.value)}
          rows={2}
          placeholder="Tell us more"
          className="rounded-xl border border-line px-3 py-2"
        />
      )}
      <p className="text-xs text-muted">Refunds follow the cancellation policy.</p>
      <Feedback msg={msg} />
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-11 flex-1 rounded-xl border border-line font-semibold">
          Keep booking
        </button>
        <button
          type="button"
          disabled={!final.trim() || pending}
          onClick={() =>
            start(async () => {
              const res = await cancelBooking(bookingId, final);
              setMsg(res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error });
              if (res.ok) router.refresh();
            })
          }
          className="h-11 flex-1 rounded-xl bg-[#c62828] font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Cancelling…" : "Cancel booking"}
        </button>
      </div>
    </div>
  );
}

export function RefundButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              "If you don't want to complete verification (KYC), we'll cancel this booking and refund the amount you paid after review. This cannot be undone.",
            )
          )
            return;
          start(async () => {
            const res = await requestRefund(bookingId);
            setMsg(res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error });
            if (res.ok) router.refresh();
          });
        }}
        className="h-12 rounded-[14px] border border-ink font-semibold hover:bg-surface disabled:opacity-50"
      >
        {pending ? "Requesting…" : "Cancel & Request Refund"}
      </button>
      <Feedback msg={msg} />
    </div>
  );
}

export function ReviewForm({ carId }: { carId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await submitReview(carId, rating, comment);
          setMsg(res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error });
          if (res.ok) router.refresh();
        });
      }}
      className="flex flex-col gap-3 rounded-xl border border-line-soft p-4"
    >
      <p className="font-semibold">Rate your trip</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className={n <= rating ? "text-star" : "text-line"}
          >
            <Icon name="star" size={28} filled />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="How was the car and the host?"
        className="rounded-xl border border-line px-3 py-2"
      />
      <Feedback msg={msg} />
      <button disabled={!rating || pending} className="h-11 rounded-xl bg-ink font-semibold text-white disabled:opacity-50">
        {pending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
