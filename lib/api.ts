import "server-only";
import { cacheLife, cacheTag } from "next/cache";

/** Same backend the Carlust app uses (FallbackValues.publicApiBaseUrl). */
export const API_BASE_URL =
  process.env.CARLUST_API_BASE_URL ?? "https://api.carlust.in";

/** Shape of a car in `/api/car` and `/api/Categorie/cars` responses. */
export type ApiCar = {
  id: string;
  title: string;
  city: string | null;
  pricePerHour: string;
  securityDeposit: string;
  seats: number;
  fuelType: string | null;
  transmissionType: string | null;
  carLocation: string | null;
  carCategoryId: string | null;
  lat: string | null;
  lng: string | null;
  driverAvailable: number;
  pickupDropAvailable: number;
  HostName: string | null;
  freeAfter: string | null;
  images: string[];
  features: string[];
  avgRating?: number;
  totalReviews?: number;
};

export type Car = {
  id: string;
  title: string;
  city: string;
  /** Full pickup address (app card shows it). */
  location: string;
  categoryId: string;
  ratePerHour: number;
  seats: number;
  fuel: string;
  transmission: string;
  hostName: string;
  freeAfter: string | null;
  images: string[];
  /** Feature keys, e.g. "ac", "reverse_camera" (see lib/filters.ts). */
  features: string[];
  rating: number;
  reviews: number;
  driverAvailable: boolean;
  doorstepAvailable: boolean;
  lat: number | null;
  lng: number | null;
};

export type Category = { id: string; name: string };

const capitalize = (s: string | null | undefined) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

const toNumber = (v: string | null | undefined) => {
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) ? n : null;
};

function toCar(c: ApiCar): Car {
  return {
    id: c.id,
    title: c.title.trim(),
    city: c.city?.trim() ?? "",
    location: c.carLocation?.trim() ?? "",
    categoryId: c.carCategoryId != null ? String(c.carCategoryId) : "",
    ratePerHour: toNumber(c.pricePerHour) ?? 0,
    seats: c.seats,
    fuel: capitalize(c.fuelType),
    transmission: capitalize(c.transmissionType),
    hostName: c.HostName?.trim() ?? "",
    freeAfter: c.freeAfter,
    images: c.images ?? [],
    features: c.features ?? [],
    rating: c.avgRating ?? 0,
    reviews: c.totalReviews ?? 0,
    driverAvailable: Boolean(c.driverAvailable),
    doorstepAvailable: Boolean(c.pickupDropAvailable),
    lat: toNumber(c.lat),
    lng: toNumber(c.lng),
  };
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Carlust API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/** First page of cars, newest first, as the app's Explore feed shows them. */
export async function getFeaturedCars(limit = 8): Promise<Car[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("cars");

  const json = await getJson<{ data?: ApiCar[] }>(`/api/car?page=1&limit=${limit}`);
  return (json.data ?? []).map(toCar);
}

type CarPage = { data?: ApiCar[]; pagination?: { totalPages?: number } };

/** Walks every page of a paged car endpoint (the catalogue is small). */
async function getAllPages(path: string, query: Record<string, string> = {}): Promise<Car[]> {
  const cars: Car[] = [];
  for (let page = 1; page <= 20; page++) {
    const qs = new URLSearchParams({ ...query, page: String(page), limit: "100" });
    const json = await getJson<CarPage>(`${path}?${qs}`);
    cars.push(...(json.data ?? []).map(toCar));
    if (page >= (json.pagination?.totalPages ?? 1)) break;
  }
  return cars;
}

/** Every listed car, or every car in one category (by name, as the app sends it). */
export async function getCars(category?: string): Promise<Car[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("cars");

  return category
    ? getAllPages("/api/Categorie/cars", { category })
    : getAllPages("/api/car");
}

/**
 * Cars free in a city for a time window (`/search/search-cars`, as the app's
 * SearchResult screen uses it). Not cached: availability changes with bookings.
 */
export async function searchAvailableCars(city: string, pickupIso: string, dropIso: string): Promise<Car[]> {
  const qs = new URLSearchParams({ city, pickupDateTime: pickupIso, dropDateTime: dropIso });
  const json = await getJson<{ available?: ApiCar[] }>(`/search/search-cars?${qs}`);
  return (json.available ?? []).map(toCar);
}

/** Extra fields only the single-car endpoint returns. Host documents and phone are deliberately dropped. */
export type CarDetail = Car & {
  userId: string;
  doors: number | null;
  luggage: number | null;
  numberPlate: string;
  securityDeposit: number;
  hostImage: string | null;
  approved: boolean;
  bookable: boolean;
};

type ApiCarDetail = ApiCar & {
  userId: string;
  doors?: number;
  luggageCapacity?: number;
  numberPlate?: string | null;
  hostName?: string | null;
  hostProfilePic?: string | null;
  carApprovalStatus?: string;
  carEnabled?: number;
  repairMode?: number;
};

export function toCarDetail(c: ApiCarDetail): CarDetail {
  return {
    ...toCar({ ...c, HostName: c.HostName ?? c.hostName ?? null }),
    userId: String(c.userId ?? ""),
    doors: c.doors ?? null,
    luggage: c.luggageCapacity ?? null,
    numberPlate: c.numberPlate ?? "",
    securityDeposit: toNumber(c.securityDeposit) ?? 0,
    hostImage: c.hostProfilePic || null,
    approved: c.carApprovalStatus === "APPROVED",
    bookable: c.carApprovalStatus === "APPROVED" && c.carEnabled !== 0 && !c.repairMode,
  };
}

export async function getCarDetail(id: string): Promise<CarDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("cars", `car-${id}`);

  try {
    const json = await getJson<{ data?: ApiCarDetail; car?: ApiCarDetail }>(`/api/car/${encodeURIComponent(id)}`);
    const raw = json.data ?? json.car;
    return raw?.id ? toCarDetail(raw) : null;
  } catch {
    return null;
  }
}

export type Review = { id: string; rating: number; comment: string; createdAt: string; userName: string };

export async function getCarReviews(carId: string): Promise<Review[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`reviews-${carId}`);

  try {
    const json = await getJson<{ data?: Record<string, unknown>[] }>(`/rating/reviews/${encodeURIComponent(carId)}`);
    return (json.data ?? []).map((r, i) => ({
      id: String(r.reviewId ?? r.id ?? i),
      rating: Number(r.rating) || 0,
      comment: String(r.comment ?? r.message ?? r.review ?? ""),
      createdAt: String(r.createdAt ?? ""),
      userName: String(r.userName ?? "Guest"),
    }));
  } catch {
    return [];
  }
}

/** Host's other approved, bookable cars (details screen "More cars hosted by"). */
export async function getHostCars(userId: string, excludeId: string): Promise<Car[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("cars");

  try {
    const json = await getJson<{ data?: ApiCarDetail[] }>(`/api/car/user/${encodeURIComponent(userId)}`);
    return (json.data ?? [])
      .filter((c) => c.id !== excludeId && c.carApprovalStatus === "APPROVED" && !c.repairMode)
      .map((c) => toCar(c));
  } catch {
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  const json = await getJson<{ data?: Category[] }>("/api/Categorie");
  return (json.data ?? []).map(({ id, name }) => ({ id, name }));
}
