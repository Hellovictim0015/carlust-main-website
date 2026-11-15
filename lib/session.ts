import "server-only";
import { cookies } from "next/headers";

/** The app's JWT, kept in an httpOnly cookie so page scripts can't read it. */
const COOKIE = "cl_token";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function getToken(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

export async function setToken(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearToken() {
  (await cookies()).delete(COOKIE);
}
