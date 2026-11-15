"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Car } from "@/lib/api";
import { formatInr, MIN_HOURS } from "@/lib/pricing";
import { Icon } from "../Icon";
import { HeartButton } from "../wishlist/HeartButton";

const MAX_PHOTOS = 5;

function formatFreeAfter(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

function Photos({ car, href, app }: { car: Car; href: string; app: boolean }) {
  const photos = car.images.slice(0, app ? 10 : MAX_PHOTOS);
  const [active, setActive] = useState(0);
  const height = app ? "h-[260px]" : "h-[200px]";

  if (photos.length === 0) {
    return (
      <div className={`flex ${height} items-center justify-center rounded-xl bg-placeholder font-bold text-[#7a808c]`}>
        {app ? "No Images Found" : <Icon name="car" size={40} />}
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex ${height} snap-x snap-mandatory overflow-x-auto rounded-xl bg-placeholder [scrollbar-width:none]`}
        onScroll={(e) => {
          const el = e.currentTarget;
          setActive(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {photos.map((src, i) => (
          <Link key={src} href={href} tabIndex={-1} className="relative h-full w-full flex-none snap-start">
            <Image
              src={src}
              alt={i === 0 ? car.title : ""}
              fill
              sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 90vw"
              className="object-cover"
            />
          </Link>
        ))}
      </div>
      {photos.length > 1 && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-[5px]">
          {photos.map((src, i) => (
            <span
              key={src}
              className={`size-[7px] rounded-full ${i === active ? (app ? "bg-brand" : "bg-white") : app ? "bg-white" : "bg-white/55"}`}
            />
          ))}
        </div>
      )}
    </>
  );
}

/** The app's CarListingCard layout: tall photo, address line, "₹208/hr". */
function AppCarCard({ car, showTotal, query }: { car: Car; showTotal: boolean; query?: string }) {
  const href = `/cars/${car.id}${query ? `?${query}` : ""}`;
  const price = showTotal ? car.ratePerHour * MIN_HOURS : car.ratePerHour;
  return (
    <article className="relative flex min-w-0 flex-col pb-5">
      <div className="relative">
        <Photos car={car} href={href} app />
        <HeartButton carId={car.id} title={car.title} className="absolute top-2.5 right-2.5" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <h3 className="min-w-0 truncate text-lg font-semibold">
          <Link href={href}>{car.title}</Link>
        </h3>
        <span className="flex flex-none items-center gap-1 text-base font-semibold">
          {car.reviews > 0 ? car.rating.toFixed(1) : "New"}
          <span className={car.reviews > 0 ? "text-[#ffd700]" : "text-muted"}>
            <Icon name="star" size={18} filled />
          </span>
          {car.reviews > 0 && <span className="text-xs font-normal text-muted">({car.reviews})</span>}
        </span>
      </div>
      {car.freeAfter && (
        <div className="mt-1 flex flex-col items-start gap-0.5">
          <span className="rounded bg-[#ffebeb] px-1.5 py-0.5 text-[10px] font-bold text-[#e53935]">Booked</span>
          <span className="truncate text-xs font-semibold text-[#e53935]">Free after: {formatFreeAfter(car.freeAfter)}</span>
        </div>
      )}
      <p className="mt-1 text-[13px] font-semibold text-muted">{car.city || "Location not available"}</p>
      <div className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold">
        <span className="min-w-0 flex-1 truncate">{car.location || car.city || "Location not available"}</span>
        {[car.transmission, car.fuel, `${car.seats} Seats`].filter(Boolean).map((v, i) => (
          <span key={v} className="flex flex-none items-center gap-1.5 text-muted">
            {i > 0 && <span aria-hidden="true" className="size-[5px] rounded-full bg-muted" />}
            {v}
          </span>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-2 text-[13px] font-semibold">
        <span>
          {formatInr(price)}
          {showTotal ? ` for ${MIN_HOURS} hrs` : "/hr"}
        </span>
        {car.hostName && <span className="truncate">Hosted by {car.hostName}</span>}
      </div>
    </article>
  );
}

export function CarCard({
  car,
  showTotal,
  variant = "web",
  query,
}: {
  car: Car;
  showTotal: boolean;
  variant?: "web" | "app";
  /** Extra query for the car link, e.g. the searched "start=…&end=…" so details and checkout keep the trip dates. */
  query?: string;
}) {
  if (variant === "app") return <AppCarCard car={car} showTotal={showTotal} query={query} />;
  const href = `/cars/${car.id}${query ? `?${query}` : ""}`;
  const price = showTotal ? car.ratePerHour * MIN_HOURS : car.ratePerHour;

  return (
    <article className="relative flex min-w-0 flex-col gap-1.5">
      <div className="relative">
        <Photos car={car} href={href} app={false} />
        <HeartButton carId={car.id} title={car.title} className="absolute top-3 right-3" />
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <h3 className="truncate text-lg font-semibold">
          <Link href={href} className="hover:underline">
            {car.title}
          </Link>
        </h3>
        <span className="flex flex-none items-center gap-[3px] text-[15px] font-semibold">
          <span className="text-star">
            <Icon name="star" size={17} filled />
          </span>
          {car.reviews > 0 ? car.rating.toFixed(1) : "New"}
          {car.reviews > 0 && <span className="text-xs font-normal text-muted">({car.reviews})</span>}
        </span>
      </div>

      {car.freeAfter && (
        <div className="mt-0.5 flex items-center gap-2">
          <span className="rounded bg-[#ffebeb] px-1.5 py-[3px] text-[11px] font-bold text-[#c62828]">Booked</span>
          <span className="text-xs font-semibold text-[#c62828]">Free after: {formatFreeAfter(car.freeAfter)}</span>
        </div>
      )}

      <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold">
        {car.city || "Location on request"}
        {[car.transmission, car.fuel, `${car.seats} Seats`].filter(Boolean).map((v) => (
          <span key={v} className="contents text-muted">
            <span className="text-muted">•</span>
            <span className="text-muted">{v}</span>
          </span>
        ))}
      </p>

      <p className="mt-1 flex flex-wrap justify-between gap-2 text-[13px] font-semibold">
        <span>
          <span className="text-base font-bold">{formatInr(price)}</span>
          {showTotal ? ` for ${MIN_HOURS} hrs` : " /hr"}
        </span>
        {car.hostName && <span className="text-ink-3">Hosted by {car.hostName}</span>}
      </p>
    </article>
  );
}
