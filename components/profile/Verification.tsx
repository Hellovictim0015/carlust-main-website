"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { kycSendAadhaarOtp, kycStartDigilocker, kycVerifyAadhaarOtp, kycVerifyDrivingLicence } from "@/app/actions/kyc";
import type { KycStatus } from "@/lib/kyc";
import { DocumentsForm } from "./ProfileForms";

type Mode = "choose" | "auto" | "manual";

const field = "w-full rounded-xl border border-line px-4 py-3 text-base outline-none focus:border-ink disabled:bg-surface";

function Msg({ kind, children }: { kind: "error" | "ok" | "info"; children: ReactNode }) {
  const cls = {
    error: "bg-[#ffe6e6] text-[#c62828]",
    ok: "bg-[#e8ffe6] text-[#1f7a44]",
    info: "bg-[#e6f2ff] text-[#0052cc]",
  }[kind];
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm font-semibold ${cls}`}>
      {children}
    </p>
  );
}

function StepHeader({ n, title, done, sub }: { n: number; title: string; done: boolean; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`flex size-8 flex-none items-center justify-center rounded-full text-sm font-extrabold ${
          done ? "bg-success text-white" : "bg-ink text-white"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <div>
        <p className="font-bold">{title}</p>
        {sub && <p className="text-sm text-muted">{sub}</p>}
      </div>
    </div>
  );
}

/** Step 1: Aadhaar number → OTP on the Aadhaar-linked mobile → verified. */
function AadhaarStep({ kyc, onUpdate }: { kyc: KycStatus; onUpdate: (k: KycStatus, note?: string) => void }) {
  const [number, setNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok" | "info"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const done = kyc.aadhaar.verified;

  if (done) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-line-soft p-5">
        <StepHeader n={1} title="Aadhaar verified" done sub={`${kyc.aadhaar.name ?? ""} · XXXX XXXX ${kyc.aadhaar.last4 ?? ""}`} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line-soft p-5">
      <StepHeader n={1} title="Verify Aadhaar" done={false} sub="We'll send an OTP to the mobile number linked with your Aadhaar." />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Aadhaar number</span>
        <input
          value={number.replace(/(\d{4})(?=\d)/g, "$1 ")}
          onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="1234 5678 9012"
          disabled={otpSent || pending}
          className={field}
        />
      </label>
      {otpSent && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">OTP</span>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit OTP"
            autoFocus
            className={field}
          />
        </label>
      )}
      {msg && <Msg kind={msg.kind}>{msg.text}</Msg>}
      <div className="flex flex-wrap gap-3">
        {!otpSent ? (
          <button
            type="button"
            disabled={number.length !== 12 || pending}
            onClick={() =>
              start(async () => {
                const r = await kycSendAadhaarOtp(number);
                if (!r.ok) return setMsg({ kind: "error", text: r.error });
                setOtpSent(true);
                setMsg({ kind: "info", text: r.message });
              })
            }
            className="h-12 rounded-[14px] bg-ink px-6 font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Sending OTP…" : "Send OTP"}
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={otp.length !== 6 || pending}
              onClick={() =>
                start(async () => {
                  const r = await kycVerifyAadhaarOtp(otp);
                  if (!r.ok) return setMsg({ kind: "error", text: r.error });
                  setMsg(null);
                  onUpdate(r.status, r.outcome === "MANUAL_REVIEW" ? r.reason : undefined);
                })
              }
              className="h-12 rounded-[14px] bg-brand px-6 font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Verifying…" : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setMsg(null);
              }}
              className="h-12 px-2 text-sm font-semibold underline"
            >
              Change number / resend
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Step 2: DL number + date of birth → checked against government records. */
function LicenceStep({ kyc, onUpdate }: { kyc: KycStatus; onUpdate: (k: KycStatus, note?: string) => void }) {
  const [dl, setDl] = useState("");
  const [dob, setDob] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  if (kyc.drivingLicence.verified) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-line-soft p-5">
        <StepHeader
          n={2}
          title="Driving licence verified"
          done
          sub={`${kyc.drivingLicence.name ?? ""} · ${kyc.drivingLicence.number ?? ""}${kyc.drivingLicence.validTill ? ` · valid till ${kyc.drivingLicence.validTill}` : ""}`}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line-soft p-5">
      <StepHeader n={2} title="Verify driving licence" done={false} sub="Checked instantly with government (Parivahan) records." />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Driving licence number</span>
          <input
            value={dl}
            onChange={(e) => setDl(e.target.value.toUpperCase().replace(/[^A-Z0-9-\s]/g, "").slice(0, 20))}
            autoComplete="off"
            placeholder="RJ14 20190012345"
            className={`${field} uppercase`}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Date of birth</span>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={today} className={field} />
        </label>
      </div>
      {msg && <Msg kind="error">{msg}</Msg>}
      <button
        type="button"
        disabled={dl.replace(/\W/g, "").length < 10 || !dob || pending}
        onClick={() =>
          start(async () => {
            const r = await kycVerifyDrivingLicence(dl.replace(/[\s-]/g, ""), dob);
            if (!r.ok) return setMsg(r.error);
            setMsg(null);
            onUpdate(r.status, r.outcome === "MANUAL_REVIEW" ? r.reason : undefined);
          })
        }
        className="h-12 self-start rounded-[14px] bg-brand px-6 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Verifying…" : "Verify licence"}
      </button>
    </div>
  );
}

/**
 * DigiLocker (Setu): user enters their DL number, signs in to DigiLocker and
 * allows Aadhaar + driving licence; DigiLocker sends them back here.
 */
function DigilockerStep({ kyc }: { kyc: KycStatus }) {
  const [dl, setDl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const both = kyc.aadhaar.verified && kyc.drivingLicence.verified;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line-soft p-5">
      <StepHeader
        n={1}
        title="Verify with DigiLocker"
        done={both}
        sub="Sign in to DigiLocker (Govt. of India) and allow Carlust to read your Aadhaar and driving licence."
      />
      {(kyc.aadhaar.verified || kyc.drivingLicence.verified) && (
        <ul className="flex flex-col gap-1 text-sm">
          <li>{kyc.aadhaar.verified ? "✅" : "⬜"} Aadhaar {kyc.aadhaar.last4 ? `· XXXX ${kyc.aadhaar.last4}` : ""}</li>
          <li>{kyc.drivingLicence.verified ? "✅" : "⬜"} Driving licence {kyc.drivingLicence.number ? `· ${kyc.drivingLicence.number}` : ""}</li>
        </ul>
      )}
      {!both && (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Driving licence number</span>
            <input
              value={dl}
              onChange={(e) => setDl(e.target.value.toUpperCase().replace(/[^A-Z0-9-\s]/g, "").slice(0, 20))}
              autoComplete="off"
              placeholder="RJ14 20190012345"
              className={`${field} uppercase`}
            />
            <span className="text-xs text-muted">Needed to fetch your licence from DigiLocker.</span>
          </label>
          {msg && <Msg kind="error">{msg}</Msg>}
          <button
            type="button"
            disabled={dl.replace(/\W/g, "").length < 10 || pending}
            onClick={() =>
              start(async () => {
                const r = await kycStartDigilocker(dl.replace(/[\s-]/g, ""), `${window.location.origin}/profile?tab=documents`);
                if (!r.ok) return setMsg(r.error);
                window.location.assign(r.url);
              })
            }
            className="h-12 self-start rounded-[14px] bg-brand px-6 font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Opening DigiLocker…" : "Continue with DigiLocker"}
          </button>
          <p className="text-xs text-muted">
            No DigiLocker account? You can create one there with your Aadhaar and the OTP on your Aadhaar-linked mobile.
          </p>
        </>
      )}
    </div>
  );
}

function OptionCard({
  icon,
  title,
  body,
  badge,
  onClick,
}: {
  icon: string;
  title: string;
  body: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-2xl border-2 border-line-soft p-5 text-left transition hover:border-ink"
    >
      <span className="flex w-full items-center justify-between">
        <span className="text-3xl" aria-hidden="true">
          {icon}
        </span>
        {badge && <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-text">{badge}</span>}
      </span>
      <span className="text-lg font-bold">{title}</span>
      <span className="text-sm text-muted">{body}</span>
    </button>
  );
}

/**
 * Identity verification with two options, like the app:
 *  - Instant: Aadhaar OTP + driving licence check (auto-approved when everything matches)
 *  - Manual: upload photos for the Carlust team to review
 */
export function Verification({ initial }: { initial: KycStatus }) {
  const router = useRouter();
  const [kyc, setKyc] = useState(initial);
  const [note, setNote] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(() => {
    if (!initial.autoAvailable) return "manual";
    if (initial.method === "AUTO" && (initial.aadhaar.verified || initial.drivingLicence.verified)) return "auto";
    return "choose";
  });

  const update = (k: KycStatus, reviewNote?: string) => {
    setKyc(k);
    if (reviewNote) setNote(reviewNote);
    router.refresh();
  };

  if (kyc.status === "VERIFIED") {
    return (
      <div className="flex flex-col gap-2 rounded-2xl bg-[#e8ffe6] p-5 text-[#1f7a44]">
        <p className="text-lg font-bold">✅ You&apos;re verified</p>
        <p className="text-sm">
          {kyc.method === "AUTO" ? "Verified instantly with Aadhaar and your driving licence." : "Your documents were approved."} You&apos;re
          all set to start trips.
        </p>
      </div>
    );
  }

  const reviewBox =
    kyc.status === "VERIFYING" ? (
      <div className="rounded-2xl bg-[#fff3e6] p-5 text-[#a85f00]">
        <p className="font-semibold">Verification under review</p>
        <p className="text-sm">
          {note || kyc.reviewReason
            ? `${note ?? kyc.reviewReason}. Our team will check your details shortly.`
            : "We'll notify you once your documents are approved."}
        </p>
      </div>
    ) : null;

  return (
    <div className="flex flex-col gap-5">
      {reviewBox}
      {kyc.testMode && <Msg kind="info">Test mode: use OTP 123456. No real checks are made.</Msg>}

      {mode === "choose" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <OptionCard
            icon="⚡"
            title="Instant verification"
            body={
              kyc.flow === "digilocker"
                ? "Share your Aadhaar and driving licence from DigiLocker. Takes about 1 minute."
                : "Verify with your Aadhaar OTP and driving licence number. Takes about 1 minute."
            }
            badge="Recommended"
            onClick={() => setMode("auto")}
          />
          <OptionCard
            icon="📄"
            title="Upload documents"
            body="Upload photos of your driving licence and Aadhaar. Our team reviews them, usually within a few hours."
            onClick={() => setMode("manual")}
          />
        </div>
      )}

      {mode === "auto" && (
        <div className="flex flex-col gap-4">
          {kyc.flow === "digilocker" ? (
            <DigilockerStep kyc={kyc} />
          ) : (
            <>
              <AadhaarStep kyc={kyc} onUpdate={update} />
              <LicenceStep kyc={kyc} onUpdate={update} />
            </>
          )}
          <p className="text-xs text-muted">
            We only keep the last 4 digits of your Aadhaar. Your name and date of birth must match on both documents.
          </p>
          <button type="button" onClick={() => setMode("manual")} className="self-start text-sm font-semibold underline">
            Having trouble? Upload documents instead
          </button>
        </div>
      )}

      {mode === "manual" && (
        <div className="flex flex-col gap-4">
          {kyc.status !== "VERIFYING" || !kyc.documentsUploaded ? (
            <DocumentsForm status="NOT_VERIFIED" />
          ) : null}
          {kyc.autoAvailable && (
            <button type="button" onClick={() => setMode("auto")} className="self-start text-sm font-semibold underline">
              ⚡ Verify instantly instead
            </button>
          )}
        </div>
      )}
    </div>
  );
}
