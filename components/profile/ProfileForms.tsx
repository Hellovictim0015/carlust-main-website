"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { deleteAccount, logout } from "@/app/actions/auth";
import { updatePhoto, updateProfile, uploadDocuments, type FormState } from "@/app/actions/profile";

function Message({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-[#ffe6e6] px-3 py-2 text-sm font-semibold text-[#c62828]">{state.error}</p>;
  if (state.message) return <p role="status" className="rounded-xl bg-[#e8ffe6] px-3 py-2 text-sm font-semibold text-[#1f7a44]">{state.message}</p>;
  return null;
}

const field = "w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-ink disabled:bg-surface disabled:text-muted";

export function PersonalInfoForm({
  name,
  email,
  phone,
  dob,
}: {
  name: string;
  email: string;
  phone: string;
  dob: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-sm text-ink-3">Full name (as on your ID)</span>
        <input name="name" defaultValue={name} required autoComplete="name" className={field} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-3">Email</span>
        <input name="email" type="email" defaultValue={email} required autoComplete="email" className={field} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-3">Phone Number</span>
        <input value={phone ? (phone.startsWith("+") ? phone : `+91 ${phone}`) : "Not provided"} disabled className={field} />
      </label>
      {dob && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-ink-3">Date of birth</span>
          <input value={dob.slice(0, 10)} disabled className={field} />
        </label>
      )}
      <div className="flex flex-col gap-3 sm:col-span-2">
        <Message state={state} />
        <button disabled={pending} className="h-[52px] rounded-[14px] bg-ink font-semibold text-white disabled:opacity-60 sm:w-56">
          {pending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export function PhotoForm({ image, name }: { image: string | null; name: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updatePhoto, {});
  const [preview, setPreview] = useState<string | null>(null);
  const src = preview ?? image;
  return (
    <form action={action} className="flex flex-wrap items-center gap-4">
      <span className="relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-ink text-3xl font-bold text-white">
        {src ? <Image src={src} alt="" fill unoptimized className="object-cover" /> : (name[0] ?? "C").toUpperCase()}
      </span>
      <label className="cursor-pointer rounded-xl border border-line px-4 py-2 text-sm font-semibold hover:border-ink">
        Choose photo
        <input
          type="file"
          name="profileImage"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
      </label>
      {preview && (
        <button disabled={pending} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Uploading…" : "Upload"}
        </button>
      )}
      <div className="w-full">
        <Message state={state} />
      </div>
    </form>
  );
}

const DOCS = [
  { group: "Upload Your Driving license", items: [{ key: "drivingLicenseImg", label: "Driving License Front" }, { key: "drivingLicenseBackImg", label: "Driving License Back" }] },
  { group: "Upload Aadhar Card", items: [{ key: "idProofImg", label: "ID Proof Front" }, { key: "idProofBackImg", label: "ID Proof Back" }] },
];

function DocPicker({ name, label }: { name: string; label: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <label className="relative flex h-36 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-line bg-surface text-sm font-semibold hover:border-ink">
      {preview ? (
        <Image src={preview} alt={label} fill unoptimized className="object-cover" />
      ) : (
        <>
          <span className="text-2xl">＋</span>
          {label}
        </>
      )}
      <input
        type="file"
        name={name}
        accept="image/*"
        required
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          setPreview(f ? URL.createObjectURL(f) : null);
        }}
      />
      {preview && <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">{label}</span>}
    </label>
  );
}

export function DocumentsForm({ status }: { status: "VERIFIED" | "VERIFYING" | "NOT_VERIFIED" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadDocuments, {});
  if (status === "VERIFIED") {
    return <p className="rounded-xl bg-[#e8ffe6] p-4 font-semibold text-[#1f7a44]">Your identity is verified. You&apos;re all set to start trips.</p>;
  }
  if (status === "VERIFYING" || state.ok) {
    return (
      <div className="rounded-xl bg-[#fff3e6] p-4 text-[#a85f00]">
        <p className="font-semibold">Verification under review</p>
        <p className="text-sm">{state.message ?? "We'll notify you once your documents are approved."}</p>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-5">
      {DOCS.map((g) => (
        <div key={g.group} className="flex flex-col gap-3">
          <p className="font-semibold">{g.group}</p>
          <div className="grid grid-cols-2 gap-3">
            {g.items.map((d) => (
              <DocPicker key={d.key} name={d.key} label={d.label} />
            ))}
          </div>
        </div>
      ))}
      <Message state={state} />
      <button disabled={pending} className="h-[52px] rounded-[14px] bg-brand font-semibold text-white disabled:opacity-60">
        {pending ? "Uploading…" : "Upload Verification Documents"}
      </button>
    </form>
  );
}

export function AccountButtons() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <form action={logout}>
        <button className="h-12 w-full rounded-[14px] border border-ink font-semibold hover:bg-surface">Logout</button>
      </form>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Delete your Carlust account? This permanently removes your profile and cannot be undone.")) return;
          start(async () => {
            const res = await deleteAccount();
            if (res && !res.ok) setError(res.error);
          });
        }}
        className="h-12 w-full rounded-[14px] font-semibold text-[#c62828] hover:bg-[#ffe6e6] disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete My Account"}
      </button>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
