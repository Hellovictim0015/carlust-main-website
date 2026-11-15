"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { sendOtp, verifyOtp } from "@/app/actions/auth";

const RESEND_SECONDS = 30;

/** Phone (+91) login with a 4-digit OTP — the app's only sign-in method. */
export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [pending, startTransition] = useTransition();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  function requestOtp(e?: FormEvent) {
    e?.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await sendOtp(phone);
      if (!res.ok) return setError(res.error);
      setStep("otp");
      setDigits(["", "", "", ""]);
      setResendIn(RESEND_SECONDS);
      requestAnimationFrame(() => inputs.current[0]?.focus());
    });
  }

  function submitOtp(code: string) {
    setError("");
    startTransition(async () => {
      const res = await verifyOtp(phone, code);
      if (!res.ok) {
        setError(res.error);
        setDigits(["", "", "", ""]);
        inputs.current[0]?.focus();
        return;
      }
      router.replace(next);
      router.refresh();
    });
  }

  function setDigit(i: number, raw: string) {
    const value = raw.replace(/\D/g, "");
    // Pasting the whole code into any box fills all four.
    if (value.length > 1) {
      const all = value.slice(0, 4).split("");
      const filled = [0, 1, 2, 3].map((k) => all[k] ?? "");
      setDigits(filled);
      if (all.length === 4) submitOtp(all.join(""));
      else inputs.current[all.length]?.focus();
      return;
    }
    const nextDigits = digits.map((d, k) => (k === i ? value : d));
    setDigits(nextDigits);
    if (value && i < 3) inputs.current[i + 1]?.focus();
    if (nextDigits.every(Boolean)) submitOtp(nextDigits.join(""));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-.8px]">Log in</h1>
        <p className="mt-1 text-muted">Welcome to Carlust</p>
      </div>

      {step === "phone" ? (
        <form onSubmit={requestOtp} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold tracking-[.6px] text-ink-3">PHONE NUMBER</span>
            <span className="flex h-14 items-center gap-3 rounded-xl border border-line px-4 focus-within:border-ink">
              <span className="font-semibold">+91</span>
              <span aria-hidden="true" className="h-6 w-px bg-line" />
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number"
                aria-label="Phone number"
                autoFocus
                className="min-w-0 flex-1 bg-transparent text-lg outline-none"
              />
            </span>
          </label>
          <p className="text-sm text-muted">We&apos;ll text you to confirm your number.</p>
          <button
            type="submit"
            disabled={phone.length !== 10 || pending}
            className="h-[52px] rounded-[14px] bg-brand text-base font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
          >
            {pending ? "Sending code…" : "Continue"}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <p className="font-semibold">Enter the verification code</p>
            <p className="text-sm text-muted">
              Sent to +91 {phone}{" "}
              <button type="button" onClick={() => setStep("phone")} className="font-semibold text-brand-link underline">
                Change
              </button>
            </p>
          </div>
          <div className="flex gap-3" role="group" aria-label="Verification code">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !d && i > 0) inputs.current[i - 1]?.focus();
                }}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                aria-label={`Digit ${i + 1}`}
                disabled={pending}
                className="size-14 rounded-xl border border-line text-center text-xl font-semibold outline-none focus:border-ink disabled:opacity-60"
              />
            ))}
          </div>
          {pending && <p className="text-sm text-muted">Verifying…</p>}
          <button
            type="button"
            onClick={() => requestOtp()}
            disabled={resendIn > 0 || pending}
            className="self-start text-sm font-semibold text-brand-link underline disabled:text-muted disabled:no-underline"
          >
            {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-[#ffe6e6] px-4 py-3 text-sm font-semibold text-[#c62828]">
          {error}
        </p>
      )}

      <p className="text-xs leading-relaxed text-muted">
        By continuing you agree to Carlust&apos;s{" "}
        <Link href="/legal/terms" className="text-brand-link underline">
          Terms and Conditions
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="text-brand-link underline">
          Privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
