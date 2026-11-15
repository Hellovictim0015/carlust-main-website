import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { contactUser } from "@/app/actions/chat";
import { CarCard } from "@/components/cars/CarCard";
import { BookingPanel } from "@/components/car/BookingPanel";
import { PhotoGallery } from "@/components/car/PhotoGallery";
import { ShareButton } from "@/components/car/ShareButton";
import { Icon, type IconName } from "@/components/Icon";
import { Avatar } from "@/components/layout/HeaderAccount";
import { HeartButton } from "@/components/wishlist/HeartButton";
import { getCarDetail, getCarReviews, getHostCars } from "@/lib/api";
import { formatMonth } from "@/lib/datetime";
import { CAR_FEATURES } from "@/lib/filters";
import { DOORSTEP_FIXED, DOORSTEP_PER_KM, formatInr } from "@/lib/pricing";

export async function generateMetadata({ params }: PageProps<"/cars/[id]">): Promise<Metadata> {
  const { id } = await params;
  const car = await getCarDetail(id);
  if (!car) return { title: "Car not found" };
  return {
    title: car.title,
    description: `${car.title} in ${car.city} — ${formatInr(car.ratePerHour)}/hr. ${car.transmission}, ${car.fuel}, ${car.seats} seats.`,
    openGraph: { images: car.images.slice(0, 1) },
  };
}

const featureLabel = (key: string) =>
  CAR_FEATURES.find((f) => f.key === key)?.label ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function Spec({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-surface">
        <Icon name={icon} size={22} />
      </span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

async function Reviews({ carId }: { carId: string }) {
  const reviews = await getCarReviews(carId);
  if (reviews.length === 0) {
    return <p className="text-muted">No reviews yet — be the first to book and review this car.</p>;
  }
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <>
      <p className="-mt-2 flex items-center gap-1 font-semibold">
        <span className="text-star">
          <Icon name="star" size={18} filled />
        </span>
        {avg.toFixed(1)} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        {reviews.slice(0, 6).map((r) => (
          <article key={r.id} className="flex flex-col gap-2 rounded-2xl border border-line-soft p-5">
            <div className="flex items-center gap-3">
              <Avatar name={r.userName} image={null} size={40} />
              <div>
                <p className="font-semibold">{r.userName}</p>
                <p className="text-xs text-muted">{formatMonth(r.createdAt)}</p>
              </div>
              <span className="ml-auto flex items-center gap-1 text-sm font-semibold">
                <span className="text-star">
                  <Icon name="star" size={15} filled />
                </span>
                {r.rating}
              </span>
            </div>
            {r.comment && <p className="text-[15px] leading-relaxed text-ink-3">{r.comment}</p>}
          </article>
        ))}
      </div>
    </>
  );
}

async function MoreFromHost({ userId, carId, hostName }: { userId: string; carId: string; hostName: string }) {
  const cars = await getHostCars(userId, carId);
  if (cars.length === 0) return null;
  return (
    <section className="flex flex-col gap-5 border-t border-line-soft pt-8">
      <h2 className="text-2xl font-extrabold">More cars hosted by {hostName || "this host"}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6">
        {cars.slice(0, 4).map((c) => (
          <CarCard key={c.id} car={c} showTotal={false} />
        ))}
      </div>
    </section>
  );
}

async function CarPage({ params, searchParams }: PageProps<"/cars/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const car = await getCarDetail(id);
  if (!car) notFound();

  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const contact = contactUser.bind(null, car.userId, `/cars/${car.id}`, "/messages");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/explore" className="hover:text-ink hover:underline">
          Explore
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="truncate text-ink">{car.title}</span>
      </nav>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-tight font-extrabold tracking-[-.6px] md:text-[34px]">{car.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[15px] font-semibold">
            <span className="flex items-center gap-1">
              <span className="text-star">
                <Icon name="star" size={16} filled />
              </span>
              {car.reviews > 0 ? `${car.rating.toFixed(1)} (${car.reviews} Reviews)` : "New"}
            </span>
            <span className="text-muted">•</span>
            <span className="underline">{car.city}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton title={car.title} />
          <HeartButton carId={car.id} title={car.title} className="border border-line bg-white! text-ink!" />
        </div>
      </div>

      <PhotoGallery images={car.images} title={car.title} />

      <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <section className="flex flex-wrap items-center justify-between gap-4 border-b border-line-soft pb-8">
            <div className="flex items-center gap-4">
              <Avatar name={car.hostName || "H"} image={car.hostImage} size={56} />
              <div>
                <p className="text-sm text-muted">Car hosted by,</p>
                <p className="text-lg font-bold">{car.hostName || "Carlust host"}</p>
              </div>
            </div>
            <form action={contact}>
              <button type="submit" className="rounded-[14px] border border-ink px-5 py-3 font-semibold hover:bg-surface">
                Contact Host
              </button>
            </form>
          </section>

          <section className="grid grid-cols-2 gap-5 border-b border-line-soft pb-8 sm:grid-cols-3">
            <Spec icon="user" label="Passengers" value={`${car.seats} Seats`} />
            <Spec icon="steering" label="Transmission type" value={car.transmission || "—"} />
            <Spec icon="fuel" label="Fuel type" value={car.fuel || "—"} />
            {car.doors != null && <Spec icon="car" label="Doors" value={String(car.doors)} />}
            {car.luggage != null && <Spec icon="wallet" label="Luggage Capacity" value={`${car.luggage} bags`} />}
          </section>

          {(car.driverAvailable || car.doorstepAvailable) && (
            <section className="flex flex-col gap-5 border-b border-line-soft pb-8">
              {car.driverAvailable && (
                <div className="flex gap-4">
                  <span className="text-brand">
                    <Icon name="steering" size={26} />
                  </span>
                  <div>
                    <p className="font-semibold">Personal Driver Included</p>
                    <p className="text-sm text-muted">Professional driver comes with this vehicle</p>
                  </div>
                </div>
              )}
              {car.doorstepAvailable && (
                <div className="flex gap-4">
                  <span className="text-brand">
                    <Icon name="truck" size={26} />
                  </span>
                  <div>
                    <p className="font-semibold">Doorstep Delivery Available</p>
                    <p className="text-sm text-muted">
                      Car At Your Doorstep — {formatInr(DOORSTEP_FIXED)} fixed + ₹{DOORSTEP_PER_KM} per km
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {car.features.length > 0 && (
            <section className="flex flex-col gap-4 border-b border-line-soft pb-8">
              <h2 className="text-2xl font-extrabold">Features</h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {car.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="text-success">
                      <Icon name="shield" size={20} />
                    </span>
                    {featureLabel(f)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="flex flex-col gap-4 border-b border-line-soft pb-8">
            <h2 className="text-2xl font-extrabold">Reviews</h2>
            <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-placeholder" />}>
              <Reviews carId={car.id} />
            </Suspense>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-extrabold">Important things to know</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <p className="font-semibold">Cancellation Policy</p>
                <p className="mt-1 text-sm text-muted">
                  See the <Link href="/legal/cancellation" className="underline">cancellation policy</Link> for refund
                  rules by time before your trip.
                </p>
              </div>
              <div>
                <p className="font-semibold">Security deposit (refundable)</p>
                <p className="mt-1 text-sm text-muted">
                  {formatInr(car.securityDeposit)}, refunded after the trip as per the{" "}
                  <Link href="/legal/refund" className="underline">refund policy</Link>.
                </p>
              </div>
              <div>
                <p className="font-semibold">Documents needed</p>
                <p className="mt-1 text-sm text-muted">Driving license and Aadhar card, verified before your trip starts.</p>
              </div>
            </div>
          </section>

          <Suspense>
            <MoreFromHost userId={car.userId} carId={car.id} hostName={car.hostName} />
          </Suspense>
        </div>

        <div className="w-full lg:sticky lg:top-6 lg:w-[400px] lg:flex-none">
          <BookingPanel
            carId={car.id}
            ratePerHour={car.ratePerHour}
            securityDeposit={car.securityDeposit}
            doorstepAvailable={car.doorstepAvailable}
            bookable={car.bookable}
            initialStart={one(sp.start)}
            initialEnd={one(sp.end)}
          />
        </div>
      </div>
    </div>
  );
}

function CarSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-4 h-9 w-2/3 animate-pulse rounded bg-placeholder" />
      <div className="h-[420px] animate-pulse rounded-2xl bg-placeholder" />
    </div>
  );
}

export default function Page(props: PageProps<"/cars/[id]">) {
  return (
    <Suspense fallback={<CarSkeleton />}>
      <CarPage {...props} />
    </Suspense>
  );
}
