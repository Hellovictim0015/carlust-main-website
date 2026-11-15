"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { defaultStart, istLocalToMs, msToIstLocal } from "@/lib/datetime";
import { Icon } from "../Icon";
import { PlaceInput } from "../search/PlaceInput";

/** Full-screen search, like the app's destination → trip calendar flow. */
export function MobileSearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [where, setWhere] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [transmission, setTransmission] = useState("");

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  function submit(e: FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (where.trim()) p.set("where", where.trim());
    if (start && end) {
      p.set("start", start);
      p.set("end", end);
    }
    if (transmission) p.set("transmission", transmission);
    router.push(`/explore${p.size ? `?${p}` : ""}`);
  }

  const field = "w-full rounded-xl border border-line px-4 py-3 text-base outline-none focus:border-ink";

  return (
    <div role="dialog" aria-modal="true" aria-label="Search cars" className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
      <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="flex size-9 items-center justify-center rounded-full shadow-[0_0_2px_rgba(0,0,0,.25)]"
        >
          <span className="rotate-180">
            <Icon name="chevronRight" size={18} />
          </span>
        </button>
        <p className="text-lg font-bold">Find your dream car</p>
      </div>
      <form onSubmit={submit} className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="m-where" className="text-sm font-semibold">
            Where
          </label>
          <PlaceInput
            id="m-where"
            value={where}
            onChange={setWhere}
            autoFocus
            required={Boolean(start || end)}
            className={field}
          />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Start Date Time</span>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => {
              const s = e.target.value;
              setStart(s);
              if (!end && Number.isFinite(istLocalToMs(s))) setEnd(msToIstLocal(istLocalToMs(s) + 12 * 3_600_000));
            }}
            onFocus={() => !start && setStart(defaultStart())}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">End Date Time</span>
          <input type="datetime-local" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Transmission</span>
          <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className={field}>
            <option value="">Any Transmission</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
          </select>
        </label>
        <div className="mt-auto flex gap-3 pb-[env(safe-area-inset-bottom)]">
          <button
            type="button"
            onClick={() => {
              setWhere("");
              setStart("");
              setEnd("");
              setTransmission("");
            }}
            className="h-[52px] flex-1 rounded-[14px] font-semibold underline"
          >
            Clear all
          </button>
          <button className="flex h-[52px] flex-[2] items-center justify-center gap-2 rounded-[14px] bg-brand font-semibold text-white">
            <Icon name="search" size={20} />
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
