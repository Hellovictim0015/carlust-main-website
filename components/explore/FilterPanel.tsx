"use client";

import { useId, useState, type ReactNode } from "react";
import {
  CAR_FEATURES,
  DEFAULT_FILTERS,
  PRICE_MAX,
  PRICE_MIN,
  SEAT_STEPS,
  type Filters,
  type Transmission,
} from "@/lib/filters";
import { formatInr } from "@/lib/pricing";
import { Switch } from "../ui/Switch";

function Group({ title, children, first = false }: { title: string; children: ReactNode; first?: boolean }) {
  const id = useId();
  return (
    <div
      role="group"
      aria-labelledby={id}
      className={`flex flex-col gap-3 ${first ? "" : "border-t border-line-soft pt-5"}`}
    >
      <h3 id={id} className="text-base font-semibold">
        {title}
      </h3>
      {children}
    </div>
  );
}

const transmissions: { value: Transmission; label: string }[] = [
  { value: "", label: "Any Transmission" },
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automatic" },
];

/**
 * Filter form from the design's sidebar. Edits a draft; "Show n cars" applies it.
 * `count` previews how many cars the draft would show.
 */
export function FilterPanel({
  value,
  count,
  onApply,
  onClose,
}: {
  value: Filters;
  count: (f: Filters) => number;
  onApply: (f: Filters) => void;
  onClose?: () => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const set = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }));

  const seatIndex = SEAT_STEPS.indexOf(draft.minSeats as (typeof SEAT_STEPS)[number]);
  const price = draft.maxPrice ?? PRICE_MAX;
  const pricePct = ((price - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const n = count(draft);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply(draft);
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-bold">Filters</h2>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_FILTERS)}
            className="text-sm font-semibold text-brand-text underline"
          >
            reset
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="flex size-9 items-center justify-center rounded-full border border-line text-xl"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <Group title="Sort By" first>
        <div className="flex flex-wrap gap-2">
          {(["asc", "desc"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={draft.sort === s}
              onClick={() => set({ sort: s })}
              className={`rounded-[10px] border px-3.5 py-[9px] text-sm ${
                draft.sort === s ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"
              }`}
            >
              {s === "asc" ? "Price: Low to High" : "Price: High to Low"}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Price Range (per hour)">
        <input
          id={`${id}-price`}
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={50}
          value={price}
          onChange={(e) => {
            const v = Number(e.target.value);
            set({ maxPrice: v >= PRICE_MAX ? null : v });
          }}
          aria-valuetext={draft.maxPrice ? `Up to ${formatInr(draft.maxPrice)}` : "Any price"}
          style={{
            background: `linear-gradient(to right, var(--color-brand) ${pricePct}%, var(--color-line-soft) ${pricePct}%)`,
          }}
          className="h-1 w-full cursor-pointer appearance-none rounded-sm accent-brand [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-white"
        />
        <div className="flex justify-between text-[13px] font-semibold text-muted">
          <span>{formatInr(PRICE_MIN)}</span>
          <span className="text-ink">{draft.maxPrice ? `Up to ${formatInr(draft.maxPrice)}` : "Any price"}</span>
          <span>{formatInr(PRICE_MAX)}+</span>
        </div>
      </Group>

      <Group title="Transmission Type">
        <div className="flex overflow-hidden rounded-[10px] border border-line">
          {transmissions.map((t, i) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={draft.transmission === t.value}
              onClick={() => set({ transmission: t.value })}
              className={`flex-1 px-1.5 py-2.5 text-sm ${i ? "border-l border-line" : ""} ${
                draft.transmission === t.value ? "bg-ink text-white" : "bg-white hover:bg-surface"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Seating Capacity">
        <div className="flex items-center justify-between">
          <span className="text-[15px]" aria-live="polite">
            {draft.minSeats ? `${draft.minSeats}+ Seats` : "Any Seats"}
          </span>
          <span className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Fewer seats"
              disabled={seatIndex <= 0}
              onClick={() => set({ minSeats: SEAT_STEPS[seatIndex - 1] })}
              className="flex size-9 items-center justify-center rounded-full border border-line text-xl disabled:opacity-40"
            >
              −
            </button>
            <span className="w-5 text-center">{draft.minSeats || "–"}</span>
            <button
              type="button"
              aria-label="More seats"
              disabled={seatIndex >= SEAT_STEPS.length - 1}
              onClick={() => set({ minSeats: SEAT_STEPS[seatIndex + 1] })}
              className="flex size-9 items-center justify-center rounded-full border border-line text-xl disabled:opacity-40"
            >
              +
            </button>
          </span>
        </div>
      </Group>

      <Group title="Features">
        <div className="flex flex-wrap gap-2">
          {CAR_FEATURES.map((f) => {
            const on = draft.features.includes(f.key);
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  set({ features: on ? draft.features.filter((k) => k !== f.key) : [...draft.features, f.key] })
                }
                className={`rounded-full border px-3 py-[7px] text-[13px] ${
                  on ? "border-brand bg-brand-soft font-semibold text-brand-text" : "border-line hover:border-ink"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </Group>

      <div className="flex flex-col gap-4 border-t border-line-soft pt-5">
        <Switch checked={draft.driver} onChange={(v) => set({ driver: v })} className="text-[15px] font-semibold">
          Cars With Driver
        </Switch>
        <Switch checked={draft.delivery} onChange={(v) => set({ delivery: v })} className="text-[15px] font-semibold">
          Cars With Pickup Drop Availability
        </Switch>
      </div>

      <button
        type="submit"
        className="h-[52px] rounded-[14px] bg-ink text-base font-semibold text-white hover:bg-ink-2"
      >
        {n === 0 ? "No cars match" : `Show ${n} ${n === 1 ? "car" : "cars"}`}
      </button>
    </form>
  );
}
