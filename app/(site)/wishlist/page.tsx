import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CarCard } from "@/components/cars/CarCard";
import type { Car } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { api } from "@/lib/backend";

export const metadata: Metadata = { title: "Wishlists", robots: { index: false } };

type Fav = Record<string, unknown>;

/** `/wishlist/my-favorites` rows → Car (wishlist_repository.dart mapping). */
function toCar(f: Fav): Car {
  const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const cap = (v: unknown) => (typeof v === "string" && v ? v[0].toUpperCase() + v.slice(1).toLowerCase() : "");
  return {
    id: String(f.car_id ?? ""),
    title: String(f.car_title ?? "Car"),
    city: String(f.city ?? ""),
    location: String(f.city ?? ""),
    categoryId: "",
    ratePerHour: n(f.pricePerHour),
    seats: n(f.seats) || 5,
    fuel: cap(f.fuelType),
    transmission: cap(f.transmissionType),
    hostName: String(f.hostName ?? ""),
    freeAfter: null,
    images: Array.isArray(f.images) ? f.images.map(String) : [],
    features: Array.isArray(f.features) ? f.features.map(String) : [],
    rating: n(f.avgRating),
    reviews: n(f.totalReviews),
    driverAvailable: false,
    doorstepAvailable: false,
    lat: null,
    lng: null,
  };
}

async function Wishlist() {
  await requireUser("/wishlist");
  const res = await api<{ data?: Fav[] }>("/wishlist/my-favorites", { query: { page: 1, limit: 100 } }).catch(() => null);
  const cars = (res?.data ?? []).map(toCar).filter((c) => c.id);

  if (!res) return <p className="text-muted">We couldn&apos;t load your Wishlists. Please refresh.</p>;
  if (cars.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-line-soft p-8">
        <p className="text-lg font-bold">Create your first wishlist</p>
        <p className="text-muted">As you search, tap the heart icon to save your favourite cars here.</p>
        <Link href="/explore" className="rounded-[14px] bg-brand px-5 py-3 font-semibold text-white">
          Find your dream car
        </Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-x-7 gap-y-8">
      {cars.map((c) => (
        <CarCard key={c.id} car={c} showTotal={false} />
      ))}
    </div>
  );
}

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="mb-6 text-[32px] font-extrabold tracking-[-.6px]">Wishlists</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-placeholder" />}>
        <Wishlist />
      </Suspense>
    </div>
  );
}
