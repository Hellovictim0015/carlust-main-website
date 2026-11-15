"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { addBankAccount, deleteCar, setCarEnabled, uploadTripPhotos } from "@/app/actions/host";
import type { FormState } from "@/app/actions/profile";

function Msg({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-[#ffe6e6] px-3 py-2 text-sm font-semibold text-[#c62828]">{state.error}</p>;
  if (state.message) return <p role="status" className="rounded-xl bg-[#e8ffe6] px-3 py-2 text-sm font-semibold text-[#1f7a44]">{state.message}</p>;
  return null;
}

export function EnableToggle({ carId, enabled }: { carId: string; enabled: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={pending}
      onClick={() => {
        const next = !on;
        setOn(next);
        start(async () => {
          const res = await setCarEnabled(carId, next);
          if (!res.ok) {
            setOn(!next);
            window.alert(res.error);
          } else router.refresh();
        });
      }}
      className="flex items-center gap-2 text-sm font-semibold disabled:opacity-60"
    >
      <span aria-hidden="true" className={`relative h-[26px] w-11 rounded-full transition-colors ${on ? "bg-success" : "bg-line"}`}>
        <span className={`absolute top-[3px] left-[3px] size-5 rounded-full bg-white transition-transform ${on ? "translate-x-[18px]" : ""}`} />
      </span>
      {on ? "Enabled" : "Disabled"}
    </button>
  );
}

export function DeleteCarButton({ carId, title }: { carId: string; title: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Delete "${title}"? This removes the listing permanently.`)) return;
        start(async () => {
          const res = await deleteCar(carId);
          if (!res.ok) window.alert(res.error);
          else router.refresh();
        });
      }}
      className="text-sm font-semibold text-[#c62828] underline disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

export function BankForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addBankAccount, {});
  const f = "rounded-xl border border-line px-3 py-2.5 outline-none focus:border-ink";
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input name="accountHolderName" placeholder="Account holder name" required className={`${f} sm:col-span-2`} />
      <input name="accountNumber" placeholder="Account number" inputMode="numeric" required className={f} />
      <input name="confirmAccountNumber" placeholder="Confirm account number" inputMode="numeric" required className={f} />
      <input name="ifscCode" placeholder="IFSC code" required className={`${f} uppercase`} />
      <input name="bankName" placeholder="Bank name" required className={f} />
      <input name="branchName" placeholder="Branch name" required className={`${f} sm:col-span-2`} />
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Msg state={state} />
        <button disabled={pending} className="h-12 rounded-[14px] bg-ink font-semibold text-white disabled:opacity-60 sm:w-56">
          {pending ? "Saving…" : "Add bank account"}
        </button>
      </div>
    </form>
  );
}

export function TripPhotosForm({ bookingId, kind }: { bookingId: string; kind: "start" | "complete" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadTripPhotos, {});
  const [previews, setPreviews] = useState<string[]>([]);
  if (state.ok) return <Msg state={state} />;
  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border border-line-soft p-4">
      <input type="hidden" name="reservationId" value={bookingId} />
      <input type="hidden" name="kind" value={kind} />
      <p className="font-semibold">{kind === "start" ? "Start trip — pickup photos" : "Complete trip — drop photos"}</p>
      <p className="text-sm text-muted">Add at least 6 clear photos of the car from every side, including the fuel gauge and odometer.</p>
      <label className="cursor-pointer rounded-xl border border-dashed border-line bg-surface p-4 text-center text-sm font-semibold hover:border-ink">
        Choose photos
        <input
          type="file"
          name="files"
          accept="image/*"
          multiple
          required
          className="sr-only"
          onChange={(e) => setPreviews(Array.from(e.target.files ?? []).map((f) => URL.createObjectURL(f)))}
        />
      </label>
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((p) => (
            <div key={p} className="relative aspect-square overflow-hidden rounded-lg">
              <Image src={p} alt="" fill unoptimized className="object-cover" />
            </div>
          ))}
        </div>
      )}
      <Msg state={state} />
      <button disabled={pending || previews.length < 6} className="h-12 rounded-[14px] bg-brand font-semibold text-white disabled:opacity-50">
        {pending ? "Uploading…" : kind === "start" ? `Start trip (${previews.length}/6)` : `Complete trip (${previews.length}/6)`}
      </button>
    </form>
  );
}
