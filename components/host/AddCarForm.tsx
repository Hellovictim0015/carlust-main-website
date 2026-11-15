"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { createListing } from "@/app/actions/host";
import type { FormState } from "@/app/actions/profile";
import type { Category } from "@/lib/api";
import { CAR_FEATURES } from "@/lib/filters";

const f = "w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-ink";

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-2xl border border-line-soft p-5 md:p-6">
      <legend className="px-1 text-lg font-bold">{title}</legend>
      {hint && <p className="-mt-2 text-sm text-muted">{hint}</p>}
      {children}
    </fieldset>
  );
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-ink-3">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex items-center gap-3 text-sm font-semibold">
      <input type="checkbox" name={name} className="size-5 accent-brand" />
      {label}
    </label>
  );
}

function DocInput({ name, label }: { name: string; label: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <label className="relative flex h-28 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-surface text-center text-sm font-semibold hover:border-ink">
      {preview ? <Image src={preview} alt={label} fill unoptimized className="object-cover" /> : label}
      <input
        type="file"
        name={name}
        accept="image/*"
        required
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          setPreview(file ? URL.createObjectURL(file) : null);
        }}
      />
    </label>
  );
}

export function AddCarForm({
  categories,
  name,
  email,
  identityVerified,
  autoAvailable,
}: {
  categories: Category[];
  name: string;
  email: string;
  /** Verified hosts skip the Aadhaar / licence upload. */
  identityVerified: boolean;
  /** Automatic (Aadhaar OTP + DL) verification is configured on the backend. */
  autoAvailable: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(createListing, {});
  const [photos, setPhotos] = useState<string[]>([]);
  const [category, setCategory] = useState(categories[0]?.id ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locMsg, setLocMsg] = useState("");

  if (state.ok) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl bg-[#e8ffe6] p-6">
        <p className="text-lg font-bold text-[#1f7a44]">Car submitted!</p>
        <p>{state.message}</p>
        <Link href="/host/listings" className="rounded-[14px] bg-ink px-5 py-3 font-semibold text-white">
          Go to My Listings
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="lat" value={coords?.lat ?? ""} />
      <input type="hidden" name="lng" value={coords?.lng ?? ""} />
      <input type="hidden" name="carType" value={categories.find((c) => c.id === category)?.name ?? ""} />

      <Section title="Vehicle Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Car title (make, model, year)" wide>
            <input name="title" required placeholder="e.g. Hyundai Creta 2023 Diesel" className={f} />
          </Field>
          <Field label="Number plate">
            <input name="numberPlate" required placeholder="RJ14CA1234" className={`${f} uppercase`} />
          </Field>
          <Field label="Category">
            <select name="carCategoryId" value={category} onChange={(e) => setCategory(e.target.value)} className={f}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Transmission">
            <select name="transmissionType" className={f} defaultValue="manual">
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </Field>
          <Field label="Fuel type">
            <select name="fuelType" className={f} defaultValue="petrol">
              {["petrol", "diesel", "cng", "electric", "hybrid"].map((v) => (
                <option key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</option>
              ))}
            </select>
          </Field>
          <Field label="Seats">
            <input name="seats" type="number" min={2} max={12} defaultValue={5} className={f} />
          </Field>
          <Field label="Doors">
            <input name="doors" type="number" min={2} max={6} defaultValue={4} className={f} />
          </Field>
          <Field label="Luggage capacity (bags)">
            <input name="luggageCapacity" type="number" min={0} max={10} defaultValue={2} className={f} />
          </Field>
        </div>
      </Section>

      <Section title="Features">
        <div className="flex flex-wrap gap-2">
          {CAR_FEATURES.map((ft) => (
            <label key={ft.key} className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand-text">
              <input type="checkbox" name="carFeatures" value={ft.key} className="sr-only" />
              {ft.label}
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Toggle name="pickupDropAvailable" label="Car at doorstep (doorstep delivery available)" />
          <Toggle name="driverAvailable" label="Driver available with this car" />
          <Toggle name="activeFastag" label="Active FASTag" />
          <Toggle name="isCamera" label="Car has a dash camera" />
          <Toggle name="isMonitor" label="Car has a GPS tracker / monitor" />
        </div>
      </Section>

      <Section title="Location">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <input name="city" required placeholder="Jaipur" className={f} />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                if (!navigator.geolocation) return setLocMsg("Location isn't available in this browser.");
                navigator.geolocation.getCurrentPosition(
                  (p) => {
                    setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
                    setLocMsg("Pickup point set to your current location.");
                  },
                  () => setLocMsg("Couldn't get your location."),
                );
              }}
              className="h-11 rounded-xl border border-ink px-4 text-sm font-semibold"
            >
              Use my current location as pickup point
            </button>
          </div>
          <Field label="Pickup address" wide>
            <textarea name="carLocation" required rows={2} placeholder="House no., street, area, city, PIN" className={f} />
          </Field>
        </div>
        {locMsg && <p className="text-sm text-muted">{locMsg}</p>}
      </Section>

      <Section title="Pricing Setup">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price per hour (₹)">
            <input name="pricePerHour" type="number" min={1} required className={f} />
          </Field>
          <Field label="Security deposit (₹, refundable)">
            <input name="securityDeposit" type="number" min={0} defaultValue={3000} className={f} />
          </Field>
        </div>
      </Section>

      <Section title="Car photos" hint="Add at least 4 clear photos — front, back, sides and interior.">
        <label className="cursor-pointer rounded-xl border border-dashed border-line bg-surface p-5 text-center text-sm font-semibold hover:border-ink">
          Choose photos ({photos.length} selected)
          <input
            type="file"
            name="carImages"
            accept="image/*"
            multiple
            required
            className="sr-only"
            onChange={(e) => setPhotos(Array.from(e.target.files ?? []).map((x) => URL.createObjectURL(x)))}
          />
        </label>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {photos.map((p) => (
              <div key={p} className="relative aspect-square overflow-hidden rounded-lg">
                <Image src={p} alt="" fill unoptimized className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Car documents" hint="Front side of each document. These are only shared with the Carlust team for verification.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <DocInput name="rc" label="RC" />
          <DocInput name="insurance" label="Insurance" />
          <DocInput name="pollution" label="Pollution (PUC)" />
        </div>
        <Field label="Walk-around video (optional)">
          <input type="file" name="video" accept="video/*" className="text-sm" />
        </Field>
      </Section>

      <Section title="Your identity" hint="Hosts verify their identity once — Aadhaar and driving licence.">
        {identityVerified ? (
          <p className="rounded-xl bg-[#e8ffe6] px-4 py-3 text-sm font-semibold text-[#1f7a44]">
            ✅ Your identity is verified — no need to upload Aadhaar or licence again.
          </p>
        ) : (
          <>
            {autoAvailable && (
              <Link
                href="/profile?tab=documents"
                target="_blank"
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-line-soft p-4 hover:border-ink"
              >
                <span>
                  <span className="block font-bold">⚡ Verify instantly (1 minute)</span>
                  <span className="block text-sm text-muted">Aadhaar OTP + driving licence number. Opens in a new tab — come back here after.</span>
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            )}
            <p className="text-sm font-semibold">{autoAvailable ? "Or upload photos for manual review" : "Upload photos for review"}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <DocInput name="aadhar" label="Aadhar" />
              <DocInput name="license" label="Driving license" />
            </div>
          </>
        )}
      </Section>

      {state.error && (
        <p role="alert" className="rounded-xl bg-[#ffe6e6] px-4 py-3 text-sm font-semibold text-[#c62828]">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="h-[52px] rounded-[14px] bg-brand font-semibold text-white hover:bg-brand-deep disabled:opacity-60 sm:w-72">
        {pending ? "Submitting…" : "Submit for approval"}
      </button>
    </form>
  );
}
