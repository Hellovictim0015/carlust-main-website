"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { api, errorMessage, getCurrentUser } from "@/lib/backend";
import type { FormState } from "./profile";

export type HostResult = { ok: true; message?: string } | { ok: false; error: string };

export async function setCarEnabled(carId: string, enabled: boolean): Promise<HostResult> {
  try {
    const res = await api<{ success?: boolean; message?: string }>(`/api/car/carenabled/${encodeURIComponent(carId)}`, {
      method: "PUT",
      body: { enabled: enabled ? 1 : 0 },
    });
    if (!res.success) return { ok: false, error: res.message || "Failed to update car status" };
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Failed to update car status") };
  }
  revalidatePath("/host");
  revalidateTag("cars", "max");
  return { ok: true };
}

export async function deleteCar(carId: string): Promise<HostResult> {
  try {
    await api(`/api/car/${encodeURIComponent(carId)}`, { method: "DELETE" });
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Could not delete this car.") };
  }
  revalidatePath("/host");
  revalidateTag("cars", "max");
  return { ok: true };
}

/** Repair mode hides the car from search (host_calendar_repository.toggleRepairMode). */
export async function setRepairMode(carId: string, on: boolean): Promise<HostResult> {
  try {
    await api(`/api/car/repair/${encodeURIComponent(carId)}`, { method: "PUT", body: { repairMode: on ? 1 : 0 } });
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Could not update repair mode.") };
  }
  revalidatePath("/host/calendar");
  revalidateTag("cars", "max");
  return { ok: true };
}

/** Block dates for your own use (Self Book). Times are IST datetime-local strings. */
export async function selfBook(_prev: FormState, form: FormData): Promise<FormState> {
  const carId = String(form.get("carId") ?? "");
  const startMs = Date.parse(`${form.get("start")}:00+05:30`);
  const endMs = Date.parse(`${form.get("end")}:00+05:30`);
  if (!carId || !Number.isFinite(startMs) || !Number.isFinite(endMs)) return { error: "Please choose a start and end time." };
  if (endMs <= startMs) return { error: "End time must be after the start time." };
  const startIso = new Date(startMs).toISOString();
  const endIso = new Date(endMs).toISOString();
  try {
    await api("/api/booking/self-book-car", {
      body: { carId, startDate: startIso, endDate: endIso, bookingStartDateTime: startIso, bookingEndDateTime: endIso },
    });
  } catch (e) {
    return { error: errorMessage(e, "Could not block these dates.") };
  }
  revalidatePath("/host/calendar");
  return { ok: true, message: "Dates blocked." };
}

export async function deleteSelfBook(id: string): Promise<HostResult> {
  try {
    await api(`/api/booking/self-book/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Could not remove this block.") };
  }
  revalidatePath("/host/calendar");
  return { ok: true };
}

export async function addBankAccount(_prev: FormState, form: FormData): Promise<FormState> {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const body = {
    accountHolderName: get("accountHolderName"),
    accountNumber: get("accountNumber").replace(/\s/g, ""),
    ifscCode: get("ifscCode").toUpperCase(),
    bankName: get("bankName"),
    branchName: get("branchName"),
  };
  if (Object.values(body).some((v) => !v)) return { error: "Please fill in every field." };
  if (!/^\d{9,18}$/.test(body.accountNumber)) return { error: "Account number should be 9–18 digits." };
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(body.ifscCode)) return { error: "Please enter a valid IFSC code." };
  if (body.accountNumber !== get("confirmAccountNumber").replace(/\s/g, "")) return { error: "Account numbers don't match." };
  try {
    await api("/bank/add", { body });
  } catch (e) {
    return { error: errorMessage(e, "Could not add the bank account.") };
  }
  revalidatePath("/host/payments");
  return { ok: true, message: "Bank account added." };
}

const isFile = (f: unknown): f is File => f instanceof File && f.size > 0;

/** Pickup (start) or drop (complete) photos for a booking; the app requires at least 6. */
export async function uploadTripPhotos(_prev: FormState, form: FormData): Promise<FormState> {
  const bookingId = String(form.get("reservationId") ?? "");
  const kind = form.get("kind") === "complete" ? "complete" : "start";
  const files = form.getAll("files").filter(isFile);
  if (!bookingId) return { error: "Missing booking." };
  if (files.length < 6) return { error: "Please add at least 6 photos of the car." };
  const fd = new FormData();
  fd.set("reservationId", bookingId);
  files.forEach((f, i) => fd.append("files", f, `${kind === "start" ? "start" : "drop"}_photo_${i}.jpg`));
  try {
    await api(`/hostBookingStartRoutes/${kind === "start" ? "start-booking" : "complete-booking"}`, { body: fd });
  } catch (e) {
    return { error: errorMessage(e, kind === "start" ? "Could not start the trip." : "Could not complete the trip.") };
  }
  revalidatePath("/host");
  return { ok: true, message: kind === "start" ? "Trip started." : "Trip completed." };
}

/** New car listing (host_onboard_repository: carData JSON + photos + documents). */
export async function createListing(_prev: FormState, form: FormData): Promise<FormState> {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const photos = form.getAll("carImages").filter(isFile);
  // Verified hosts (auto or manual KYC) don't re-upload Aadhaar / licence.
  const verified = Boolean((await getCurrentUser())?.isVerified);
  const docs = (verified ? ["rc", "insurance", "pollution"] : ["rc", "insurance", "pollution", "aadhar", "license"]) as readonly string[];

  const title = get("title");
  const price = Number(get("pricePerHour"));
  const deposit = Number(get("securityDeposit"));
  const plate = get("numberPlate").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!title || !get("city") || !get("carLocation")) return { error: "Please add the car title, city and pickup address." };
  if (!(price > 0)) return { error: "Please set an hourly price." };
  if (!/^[A-Z0-9]{6,11}$/.test(plate)) return { error: "Please enter a valid number plate, e.g. RJ14CA1234." };
  if (photos.length < 4) return { error: "Please add at least 4 photos of the car." };
  for (const d of docs) {
    if (!isFile(form.get(d))) {
      return {
        error: verified
          ? "Please upload the RC, insurance and pollution (PUC) documents."
          : "Please upload the car documents and your Aadhaar and driving licence, or verify your identity instantly first.",
      };
    }
  }

  const carData = {
    name: get("name"),
    email: get("email"),
    city: get("city"),
    lat: get("lat") || null,
    long: get("lng") || null,
    carLocation: get("carLocation"),
    seats: Number(get("seats")) || 5,
    doors: Number(get("doors")) || 4,
    luggageCapacity: Number(get("luggageCapacity")) || 2,
    transmissionType: get("transmissionType") || "manual",
    fuelType: get("fuelType") || "petrol",
    carCategoryId: get("carCategoryId"),
    carType: get("carType"),
    carFeatures: form.getAll("carFeatures").map(String),
    pickupDropAvailable: form.get("pickupDropAvailable") === "on",
    carImages: photos.map((_, i) => `car_image_${i}.jpg`),
    title,
    numberPlate: plate,
    activeFastag: form.get("activeFastag") === "on",
    pricePerHour: price,
    securityDeposit: Number.isFinite(deposit) && deposit >= 0 ? deposit : 3000,
    driverAvailable: form.get("driverAvailable") === "on",
    isCamera: form.get("isCamera") === "on",
    isWeapon: false,
    isMonitor: form.get("isMonitor") === "on",
  };

  const fd = new FormData();
  fd.set("carData", JSON.stringify(carData));
  photos.forEach((f, i) => fd.append("carImages", f, `car_image_${i}.jpg`));
  for (const d of docs) fd.set(d, form.get(d) as File, `${d}.jpg`);
  const video = form.get("video");
  if (isFile(video)) fd.set("video", video, "video.mp4");

  try {
    await api("/api/car/cars/create-listing", { body: fd });
  } catch (e) {
    return { error: errorMessage(e, "Could not submit your car. Please try again.") };
  }
  revalidatePath("/host");
  return { ok: true, message: "Your car has been submitted for approval. Customers can book it 24 hours after it's published." };
}
