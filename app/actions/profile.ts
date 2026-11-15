"use server";

import { revalidatePath } from "next/cache";
import { api, errorMessage } from "@/lib/backend";

export type FormState = { ok?: boolean; error?: string; message?: string };

/** `/api/auth/profile/update` takes one field per request as multipart (edit_profile_information_screen). */
async function updateField(key: string, value: string | Blob) {
  const fd = new FormData();
  fd.set(key, value);
  await api("/api/auth/profile/update", { method: "PUT", body: fd });
}

export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  if (!name) return { error: "Please enter your full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  try {
    await updateField("name", name);
    await updateField("email", email);
  } catch (e) {
    return { error: errorMessage(e, "Could not save your details. Please try again.") };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

const MAX_BYTES = 8 * 1024 * 1024;
const isImage = (f: unknown): f is File => f instanceof File && f.size > 0 && f.type.startsWith("image/");

export async function updatePhoto(_prev: FormState, form: FormData): Promise<FormState> {
  const file = form.get("profileImage");
  if (!isImage(file)) return { error: "Please choose an image." };
  if (file.size > MAX_BYTES) return { error: "Image must be under 8 MB." };
  try {
    await updateField("profileImage", file);
  } catch (e) {
    return { error: errorMessage(e, "Could not upload your photo.") };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Photo updated." };
}

const DOCS = ["drivingLicenseImg", "drivingLicenseBackImg", "idProofImg", "idProofBackImg"] as const;

/** Driving license + Aadhar, front and back (document_verification_screen). */
export async function uploadDocuments(_prev: FormState, form: FormData): Promise<FormState> {
  const fd = new FormData();
  for (const key of DOCS) {
    const f = form.get(key);
    if (!isImage(f)) return { error: "Please select all four document photos." };
    if (f.size > MAX_BYTES) return { error: "Each photo must be under 8 MB." };
    fd.set(key, f);
  }
  try {
    await api("/api/auth/upload-documents", { body: fd });
  } catch (e) {
    return { error: errorMessage(e, "Failed to upload verification documents. Please try again.") };
  }
  revalidatePath("/profile");
  return { ok: true, message: "Verification documents uploaded successfully! Your account will be reviewed shortly." };
}
