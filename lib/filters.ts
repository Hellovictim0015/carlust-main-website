import type { Car } from "./api";

/** Car features, ported from kCarFeatures in the app (key → label). */
export const CAR_FEATURES = [
  { key: "ac", label: "AC" },
  { key: "bluetooth", label: "Bluetooth" },
  { key: "gps", label: "GPS" },
  { key: "reverse_camera", label: "Reverse Camera" },
  { key: "sunroof", label: "Sunroof" },
  { key: "usb", label: "USB Charger" },
  { key: "spare_tyre", label: "Spare Tyre" },
  { key: "parking", label: "Parking Sensor" },
  { key: "backup_camera", label: "Backup Camera" },
  { key: "abs", label: "Anti Lock Braking System" },
  { key: "traction", label: "Traction Control" },
] as const;

export const PRICE_MIN = 100;
export const PRICE_MAX = 5000;
/** Seat steps for the "at least N seats" stepper; 0 means any. */
export const SEAT_STEPS = [0, 2, 4, 5, 6, 7] as const;

export type Transmission = "" | "manual" | "automatic";

export type Filters = {
  sort: "asc" | "desc";
  /** Max price per hour; null = no limit. */
  maxPrice: number | null;
  transmission: Transmission;
  /** Minimum seats; 0 = any. */
  minSeats: number;
  features: string[];
  driver: boolean;
  delivery: boolean;
};

export const DEFAULT_FILTERS: Filters = {
  sort: "asc",
  maxPrice: null,
  transmission: "",
  minSeats: 0,
  features: [],
  driver: false,
  delivery: false,
};

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseFilters(params: Params): Filters {
  const price = Number(first(params.maxPrice));
  const seats = Number(first(params.seats));
  const transmission = first(params.transmission);
  const featureKeys = new Set<string>(CAR_FEATURES.map((f) => f.key));
  const mode = first(params.mode);

  return {
    sort: first(params.sort) === "desc" ? "desc" : "asc",
    maxPrice: price >= PRICE_MIN && price < PRICE_MAX ? price : null,
    transmission: transmission === "manual" || transmission === "automatic" ? transmission : "",
    minSeats: (SEAT_STEPS as readonly number[]).includes(seats) ? seats : 0,
    features: first(params.features)
      .split(",")
      .filter((f) => featureKeys.has(f)),
    driver: first(params.driver) === "1" || mode === "driver",
    delivery: first(params.delivery) === "1" || mode === "doorstep",
  };
}

/** Writes filters into URL params, leaving defaults out so URLs stay short. */
export function writeFilters(params: URLSearchParams, f: Filters) {
  const set = (key: string, value: string | null) => (value ? params.set(key, value) : params.delete(key));
  params.delete("mode");
  set("sort", f.sort === "desc" ? "desc" : null);
  set("maxPrice", f.maxPrice ? String(f.maxPrice) : null);
  set("transmission", f.transmission || null);
  set("seats", f.minSeats ? String(f.minSeats) : null);
  set("features", f.features.length ? f.features.join(",") : null);
  set("driver", f.driver ? "1" : null);
  set("delivery", f.delivery ? "1" : null);
}

/** Same rules as the app's cars_feed_provider: filter, then sort by hourly rate. */
export function applyFilters(cars: Car[], f: Filters): Car[] {
  return cars
    .filter((c) => {
      if (f.maxPrice != null && c.ratePerHour > f.maxPrice) return false;
      if (f.transmission && c.transmission.toLowerCase() !== f.transmission) return false;
      if (f.minSeats && c.seats < f.minSeats) return false;
      if (f.features.length && !f.features.every((k) => c.features.includes(k))) return false;
      if (f.driver && !c.driverAvailable) return false;
      if (f.delivery && !c.doorstepAvailable) return false;
      return true;
    })
    .sort((a, b) => (f.sort === "asc" ? a.ratePerHour - b.ratePerHour : b.ratePerHour - a.ratePerHour));
}

export function countActive(f: Filters) {
  return (
    (f.sort !== "asc" ? 1 : 0) +
    (f.maxPrice != null ? 1 : 0) +
    (f.transmission ? 1 : 0) +
    (f.minSeats ? 1 : 0) +
    f.features.length +
    (f.driver ? 1 : 0) +
    (f.delivery ? 1 : 0)
  );
}
