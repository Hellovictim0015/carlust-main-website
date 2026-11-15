"use client";

import { useId, useState } from "react";
import { istLocalToMs, msToIstLocal } from "@/lib/datetime";
import { MIN_HOURS, QUICK_DURATIONS } from "@/lib/pricing";

/**
 * Start/end pickers + Quick Duration Selection + custom hours, shared by the
 * details panel and checkout. Values are IST `datetime-local` strings.
 */
export function TripTimes({
  start,
  end,
  onChange,
  compact = false,
}: {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  compact?: boolean;
}) {
  const id = useId();
  const [minStart] = useState(() => msToIstLocal(Date.now()));
  const startMs = istLocalToMs(start);
  const endMs = istLocalToMs(end);
  const hours = Number.isFinite(startMs) && Number.isFinite(endMs) ? Math.round((endMs - startMs) / 3_600_000) : 0;
  const withHours = (h: number) => onChange(start, msToIstLocal(startMs + h * 3_600_000));

  const field =
    "w-full rounded-xl border border-line px-3 py-2.5 text-[15px] font-semibold outline-none focus:border-ink";

  return (
    <div className="flex flex-col gap-4">
      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
        <label htmlFor={`${id}-s`} className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-[.4px] text-ink-3">START DATE TIME</span>
          <input
            id={`${id}-s`}
            type="datetime-local"
            value={start}
            min={minStart}
            onChange={(e) => {
              const s = e.target.value;
              const sMs = istLocalToMs(s);
              // Keep the same duration when the start moves.
              const keep = hours > 0 ? hours : MIN_HOURS;
              onChange(s, Number.isFinite(sMs) ? msToIstLocal(sMs + keep * 3_600_000) : end);
            }}
            className={field}
          />
        </label>
        <label htmlFor={`${id}-e`} className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-[.4px] text-ink-3">END DATE TIME</span>
          <input
            id={`${id}-e`}
            type="datetime-local"
            value={end}
            min={start}
            onChange={(e) => onChange(start, e.target.value)}
            className={field}
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Quick Duration Selection</span>
        <div className="flex flex-wrap gap-2">
          {QUICK_DURATIONS.map((h) => (
            <button
              key={h}
              type="button"
              aria-pressed={hours === h}
              onClick={() => withHours(h)}
              className={`rounded-[10px] border px-3.5 py-2 text-sm font-semibold ${
                hours === h ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-sm">
          <span className="text-ink-3">Or Enter Custom Hours</span>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_HOURS}
            max={24 * 30}
            placeholder="Hours"
            defaultValue={QUICK_DURATIONS.includes(hours as (typeof QUICK_DURATIONS)[number]) ? "" : hours || ""}
            key={hours}
            onBlur={(e) => {
              const h = Math.floor(Number(e.target.value));
              if (h >= MIN_HOURS) withHours(h);
              else if (e.target.value) e.target.value = String(hours || "");
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
            className="w-24 rounded-[10px] border border-line px-3 py-2 outline-none focus:border-ink"
          />
        </label>
        {hours > 0 && hours < MIN_HOURS && (
          <p className="text-xs font-semibold text-warning">
            The minimum rental duration is {MIN_HOURS} hours; you&apos;ll be charged for {MIN_HOURS}.
          </p>
        )}
        {Number.isFinite(endMs) && Number.isFinite(startMs) && endMs <= startMs && (
          <p className="text-xs font-semibold text-error">End time must be after the start time.</p>
        )}
      </div>
    </div>
  );
}
