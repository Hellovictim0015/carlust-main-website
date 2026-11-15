"use server";

import { revalidatePath } from "next/cache";
import { api, errorMessage } from "@/lib/backend";
import { toKycStatus, type KycStatus } from "@/lib/kyc";

export type KycResult =
  | { ok: true; message: string; status: KycStatus; outcome?: string; reason?: string }
  | { ok: false; error: string };

type Res = { message?: string; status?: string; reason?: string; data?: Record<string, unknown> };

const done = (res: Res): KycResult => {
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: res.message || "Done.",
    status: toKycStatus(res.data ?? {}),
    outcome: res.status,
    reason: res.reason,
  };
};

/** DigiLocker (Setu): returns the DigiLocker URL to send the user to. */
export async function kycStartDigilocker(
  dlNumber: string,
  returnUrl: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const res = await api<{ url?: string }>("/api/kyc/digilocker/start", { body: { dlNumber, returnUrl } });
    if (!res.url) return { ok: false, error: "Could not start DigiLocker. Please try again." };
    return { ok: true, url: res.url };
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Could not start DigiLocker. Please try again.") };
  }
}

export async function kycSendAadhaarOtp(aadhaarNumber: string): Promise<KycResult> {
  try {
    const res = await api<Res>("/api/kyc/aadhaar/send-otp", { body: { aadhaarNumber: aadhaarNumber.replace(/\D/g, "") } });
    return { ok: true, message: res.message || "OTP sent.", status: toKycStatus({}) };
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Could not send OTP.") };
  }
}

export async function kycVerifyAadhaarOtp(otp: string): Promise<KycResult> {
  try {
    return done(await api<Res>("/api/kyc/aadhaar/verify-otp", { body: { otp: otp.trim() } }));
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Incorrect or expired OTP.") };
  }
}

export async function kycVerifyDrivingLicence(dlNumber: string, dob: string): Promise<KycResult> {
  try {
    return done(await api<Res>("/api/kyc/driving-licence/verify", { body: { dlNumber, dob } }));
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Could not verify this driving licence.") };
  }
}
