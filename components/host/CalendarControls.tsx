"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { deleteSelfBook, selfBook, setRepairMode } from "@/app/actions/host";
import type { FormState } from "@/app/actions/profile";
import { defaultStart, istLocalToMs, msToIstLocal } from "@/lib/datetime";

export function RepairToggle({ carId, on }: { carId: string; on: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(on);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={pending}
      onClick={() => {
        const next = !value;
        setValue(next);
        start(async () => {
          const res = await setRepairMode(carId, next);
          if (!res.ok) {
            setValue(!next);
            window.alert(res.error);
          } else router.refresh();
        });
      }}
      className="flex items-center gap-3 text-left disabled:opacity-60"
    >
      <span aria-hidden="true" className={`relative h-[26px] w-11 flex-none rounded-full transition-colors ${value ? "bg-warning" : "bg-line"}`}>
        <span className={`absolute top-[3px] left-[3px] size-5 rounded-full bg-white transition-transform ${value ? "translate-x-[18px]" : ""}`} />
      </span>
      <span>
        <span className="block text-sm font-semibold">Repair mode</span>
        <span className="block text-xs text-muted">{value ? "Hidden from customers" : "Visible to customers"}</span>
      </span>
    </button>
  );
}

export function SelfBookForm({ carId }: { carId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(selfBook, {});
  const [start, setStart] = useState(() => defaultStart(1));
  const [end, setEnd] = useState(() => msToIstLocal(istLocalToMs(defaultStart(1)) + 24 * 3_600_000));
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  const f = "w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-ink";
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="carId" value={carId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-3">Block from</span>
          <input type="datetime-local" name="start" value={start} onChange={(e) => setStart(e.target.value)} required className={f} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-3">Until</span>
          <input type="datetime-local" name="end" value={end} min={start} onChange={(e) => setEnd(e.target.value)} required className={f} />
        </label>
      </div>
      {state.error && <p role="alert" className="text-sm font-semibold text-error">{state.error}</p>}
      {state.message && <p role="status" className="text-sm font-semibold text-success">{state.message}</p>}
      <button disabled={pending} className="h-11 rounded-xl bg-ink font-semibold text-white disabled:opacity-60 sm:w-48">
        {pending ? "Blocking…" : "Block Dates"}
      </button>
    </form>
  );
}

export function RemoveSelfBook({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await deleteSelfBook(id);
          if (!res.ok) window.alert(res.error);
          else router.refresh();
        })
      }
      className="text-sm font-semibold text-[#c62828] underline disabled:opacity-60"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
