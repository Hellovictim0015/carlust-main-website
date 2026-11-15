"use server";

import { redirect } from "next/navigation";
import { api, errorMessage } from "@/lib/backend";
import { clearToken, setToken } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

const isPhone = (p: string) => /^\d{10}$/.test(p);

/** Step 1 of the app's phone login: text a 4-digit OTP to +91 number. */
export async function sendOtp(phone: string): Promise<ActionResult> {
  if (!isPhone(phone)) return { ok: false, error: "Please enter a valid 10-digit mobile number." };
  try {
    await api("/api/auth/send-otp", { body: { phoneNumber: `+91${phone}` }, anonymous: true });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Failed to send OTP. Please try again.") };
  }
}

/** Step 2: verify the OTP; the API returns a session token (new users are created). */
export async function verifyOtp(phone: string, otp: string): Promise<ActionResult> {
  if (!isPhone(phone) || !/^\d{4}$/.test(otp)) return { ok: false, error: "Enter the 4-digit code." };
  try {
    const res = await api<{ token?: string }>("/api/auth/verify-otp", {
      body: { phoneNumber: `+91${phone}`, otp },
      anonymous: true,
    });
    if (!res.token) return { ok: false, error: "Failed to login. Please try again." };
    await setToken(res.token);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Invalid code. Please try again.") };
  }
}

export async function logout() {
  await clearToken();
  redirect("/");
}

export async function deleteAccount(): Promise<ActionResult> {
  try {
    await api("/api/auth/delete-account", { method: "DELETE" });
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
  await clearToken();
  redirect("/");
}
