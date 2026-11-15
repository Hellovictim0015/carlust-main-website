"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Car } from "@/lib/api";
import { formatInr } from "@/lib/pricing";
import { CarCard } from "../cars/CarCard";
import { Icon } from "../Icon";
import { CarMap } from "../map/CarMap";

/** Google Map beside the list (app map style); tapping a marker shows that car below. */
function MapPreview({ cars }: { cars: Car[] }) {
  const [selected, setSelected] = useState(cars[0]?.id);
  const car = cars.find((c) => c.id === selected) ?? cars[0];

  return (
    <div className="relative hidden h-[680px] min-w-0 flex-[1_1_420px] overflow-hidden rounded-3xl border border-line-soft lg:sticky lg:top-6 lg:block">
      <CarMap cars={cars} className="absolute inset-0" onSelect={(c) => setSelected(c.id)} fitToCars zoomButtons />

      <Link
        href="/explore"
        className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-[11px] text-[15px] font-bold whitespace-nowrap text-white shadow-[0_4px_12px_rgba(0,0,0,.25)]"
      >
        <Icon name="map" size={18} />
        Open full map
      </Link>

      {car && (
        <Link
          href={`/cars/${car.id}`}
          className="absolute inset-x-4 bottom-4 flex items-center gap-3.5 rounded-2xl border border-ink bg-white p-3 shadow-[0_6px_20px_rgba(0,0,0,.15)]"
        >
          <div className="relative h-[86px] w-[130px] flex-none overflow-hidden rounded-xl bg-placeholder">
            {car.images[0] && (
              <Image src={car.images[0]} alt="" fill sizes="130px" className="object-cover" />
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-[17px] font-semibold">{car.title}</span>
            <span className="text-base font-semibold">{formatInr(car.ratePerHour)} /hr</span>
            <span className="truncate text-[13px] font-semibold text-muted">{car.city}</span>
          </div>
        </Link>
      )}
    </div>
  );
}

export function NearbyCars({ cars }: { cars: Car[] }) {
  const [showTotal, setShowTotal] = useState(false);

  return (
    <>
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-sm font-bold tracking-[.6px] text-brand-text">AVAILABLE NOW</p>
          <h2 className="text-[28px] font-extrabold tracking-[-.8px] md:text-[34px]">Find your dream car</h2>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <button
            type="button"
            role="switch"
            aria-checked={showTotal}
            onClick={() => setShowTotal((v) => !v)}
            className="flex items-center gap-3.5 rounded-[14px] border border-line py-2 pr-2.5 pl-4 text-left"
          >
            <span className="flex flex-col">
              <span className="text-[15px] font-semibold">Display total price</span>
              <span className="text-xs text-muted">Before fees &amp; taxes</span>
            </span>
            <span
              aria-hidden="true"
              className={`relative h-[30px] w-[50px] rounded-full transition-colors ${showTotal ? "bg-ink" : "bg-muted"}`}
            >
              <span
                className={`absolute top-1 left-1 size-[22px] rounded-full bg-white transition-transform ${
                  showTotal ? "translate-x-5" : ""
                }`}
              />
            </span>
          </button>
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-[15px] font-bold text-ink underline underline-offset-4"
          >
            See all cars <Icon name="chevronRight" size={18} />
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-7">
        <div className="grid min-w-0 flex-[999_1_560px] grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-x-6 gap-y-7">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} showTotal={showTotal} />
          ))}
        </div>
        <MapPreview cars={cars} />
      </div>
    </>
  );
}
