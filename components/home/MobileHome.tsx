"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Car, Category } from "@/lib/api";
import { formatInr } from "@/lib/pricing";
import { CarCard } from "../cars/CarCard";
import { Icon } from "../Icon";
import { Switch } from "../ui/Switch";
import { NotificationBell } from "../layout/NotificationBell";
import { CarMap } from "../map/CarMap";
import { MobileSearchSheet } from "./MobileSearchSheet";

const PAGE = 10;

/**
 * Phone layout of the home page, matching the app's Explore screen:
 * search pill + filter, category chips, map with a car rail, and the
 * car list in a bottom sheet with a floating Map / List switch.
 */
export function MobileHome({ cars, categories }: { cars: Car[]; categories: Category[] }) {
  const [category, setCategory] = useState("All Cars");
  const [showTotal, setShowTotal] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const [mapInView, setMapInView] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (category === "All Cars") return cars;
    const id = categories.find((c) => c.name === category)?.id;
    return cars.filter((c) => c.categoryId === id);
  }, [cars, categories, category]);

  // Map ⇄ List pill follows whether the map is on screen.
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setMapInView(e.intersectionRatio > 0.5), { threshold: [0, 0.5, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Infinite list, like the app's sheet fetching the next page near the end.
  useEffect(() => {
    const el = moreRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible((v) => v + PAGE), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  const chips = ["All Cars", ...categories.map((c) => c.name)];
  const rail = filtered.slice(0, 50);

  return (
    <div className="md:hidden">
      <header className="sticky top-0 z-30 border-b border-line/60 bg-white py-[15px]">
        <div className="flex h-[52px] items-center gap-4 px-4">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-full min-w-0 flex-1 items-center gap-3.5 rounded-[28px] bg-white px-5 text-left shadow-[0_2px_6px_rgba(0,0,0,.18)]"
          >
            <Icon name="search" size={24} />
            <span className="flex min-w-0 flex-col">
              <span className="text-base">Find your dream car</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="text-ink/50">Anywhere</span>
                <span aria-hidden="true" className="size-1 rounded-full bg-muted" />
                <span className="text-muted">Any week</span>
              </span>
            </span>
          </button>
          <div className="-mr-2 flex items-center">
            <NotificationBell />
            <Link href="/explore?filters=1" aria-label="Filters" className="p-2">
              <Icon name="filter" size={26} />
            </Link>
          </div>
        </div>
        <nav aria-label="Categories" className="mt-5 flex gap-2 overflow-x-auto px-3 [scrollbar-width:none]">
          {chips.map((name) => {
            const on = name === category;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setCategory(name);
                  setVisible(PAGE);
                }}
                className={`flex min-w-20 flex-none items-center justify-center gap-1.5 rounded-xl border-[1.5px] px-3.5 py-2.5 text-[13px] whitespace-nowrap ${
                  on ? "border-brand bg-brand font-bold text-white" : "border-line bg-white font-semibold text-ink"
                }`}
              >
                <Icon name="car" size={20} />
                {name}
              </button>
            );
          })}
        </nav>
      </header>

      <div ref={mapRef} className="relative h-[58vh] min-h-[380px] overflow-hidden">
        <CarMap cars={filtered} className="absolute inset-0" />
        <div className="absolute inset-x-0 top-[6%] flex h-[130px] gap-2.5 overflow-x-auto px-2.5 [scrollbar-width:none]">
          {rail.length === 0 ? (
            <p className="m-auto rounded-xl bg-white/90 px-4 py-2 font-bold">No cars available in this area</p>
          ) : (
            rail.map((c) => (
              <Link
                key={c.id}
                href={`/cars/${c.id}`}
                className="flex h-fit w-[50vw] flex-none flex-col rounded-lg border border-ink/60 bg-white p-2"
              >
                <span className="relative block h-[70px] overflow-hidden rounded-lg bg-placeholder">
                  {c.images[0] && <Image src={c.images[0]} alt="" fill sizes="50vw" className="object-cover" />}
                </span>
                <span className="mt-1 truncate text-[15px] font-semibold">{c.title}</span>
                <span className="text-[15px] font-semibold">{formatInr(c.ratePerHour)} /hr</span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div
        ref={listRef}
        className="relative z-10 -mt-6 scroll-mt-[150px] rounded-t-[20px] bg-white px-4 shadow-[0_-4px_12px_rgba(0,0,0,.15)]"
      >
        <div className="flex justify-center py-2">
          <span aria-hidden="true" className="h-1 w-10 rounded-sm bg-line" />
        </div>
        <Switch
          checked={showTotal}
          onChange={setShowTotal}
          className="mb-4 h-[68px] w-full rounded-xl border border-ink/60 px-4"
        >
          <span className="flex flex-col">
            <span className="text-base font-semibold">Display total price</span>
            <span className="text-sm text-ink-3">Before fees &amp; taxes</span>
          </span>
        </Switch>

        {filtered.length === 0 ? (
          <p className="py-10 text-center font-bold">No cars found, try changing the filters</p>
        ) : (
          filtered.slice(0, visible).map((car) => <CarCard key={car.id} car={car} showTotal={showTotal} variant="app" />)
        )}
        {visible < filtered.length && <div ref={moreRef} className="h-8" />}
        <div className="h-24" />
      </div>

      <button
        type="button"
        onClick={() =>
          mapInView
            ? listRef.current?.scrollIntoView({ behavior: "smooth" })
            : window.scrollTo({ top: 0, behavior: "smooth" })
        }
        className="fixed bottom-[88px] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-3xl bg-ink px-4 py-2.5 font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,.25)]"
      >
        <Icon name={mapInView ? "filter" : "map"} size={18} />
        {mapInView ? "List" : "Map"}
      </button>

      <MobileSearchSheet open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
