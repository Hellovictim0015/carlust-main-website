"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Car, Category } from "@/lib/api";
import { applyFilters, countActive, DEFAULT_FILTERS, writeFilters, type Filters } from "@/lib/filters";
import { MIN_HOURS } from "@/lib/pricing";
import { CarCard } from "../cars/CarCard";
import { Icon } from "../Icon";
import { Switch } from "../ui/Switch";
import { FilterPanel } from "./FilterPanel";

const PAGE_SIZE = 12;

export type SearchSummary = {
  where: string;
  /** Display strings for the trip window, if dates were searched. */
  start: string;
  end: string;
  category: string;
  /** "start=…&end=…" when dates were searched; carried into car details and checkout. */
  tripQuery: string;
};

function CategoryChips({ categories, active }: { categories: Category[]; active: string }) {
  const chip = (on: boolean) =>
    `flex-none rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap ${
      on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"
    }`;
  return (
    <nav aria-label="Categories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
      <Link href="/explore" aria-current={!active ? "page" : undefined} className={chip(!active)}>
        All Cars
      </Link>
      {categories.map((c) => {
        const on = c.name.toLowerCase() === active.toLowerCase();
        return (
          <Link
            key={c.id}
            href={`/explore?category=${encodeURIComponent(c.name)}`}
            aria-current={on ? "page" : undefined}
            className={chip(on)}
          >
            {c.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function ExploreView({
  cars,
  initialFilters,
  summary,
  categories,
  openFilters = false,
}: {
  cars: Car[];
  initialFilters: Filters;
  summary: SearchSummary;
  categories: Category[];
  openFilters?: boolean;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [showTotal, setShowTotal] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  // "?filters=1" (the filter icon on the phone home) opens the filter sheet straight away.
  const [sheetOpen, setSheetOpen] = useState(openFilters);

  const results = useMemo(() => applyFilters(cars, filters), [cars, filters]);
  const active = countActive(filters);

  function apply(next: Filters) {
    setFilters(next);
    setVisible(PAGE_SIZE);
    setSheetOpen(false);
    // Keep filters in the URL (shareable, survives refresh) without refetching.
    const params = new URLSearchParams(window.location.search);
    writeFilters(params, next);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  // Lock page scroll and close on Escape while the mobile filter sheet is open.
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  const panelKey = JSON.stringify(filters);
  const count = (f: Filters) => applyFilters(cars, f).length;
  const place = summary.where || "Anywhere";
  const dates = summary.start && summary.end ? `${summary.start} – ${summary.end}` : "Any dates";
  const heading = `${results.length} ${results.length === 1 ? "car" : "cars"}${
    summary.where ? ` in ${summary.where}` : summary.category ? ` · ${summary.category}` : " available"
  }`;

  return (
    <>
      <div className="border-b border-line-soft">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 md:gap-4 md:px-8">
          <div
            role="search"
            aria-label="Your search"
            className="flex min-w-0 flex-[1_1_320px] items-center gap-3.5 rounded-full border border-line py-1.5 pr-1.5 pl-5 shadow-card"
          >
            <Icon name="search" size={20} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[15px] font-bold">Find your dream car</span>
              <span className="truncate text-[13px] text-muted">
                {place} • {dates}
              </span>
            </div>
            <Link
              href="/#search"
              className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold hover:border-ink"
            >
              Edit
            </Link>
          </div>
          <Switch
            checked={showTotal}
            onChange={setShowTotal}
            className="rounded-xl border border-line px-3.5 py-2"
          >
            <span className="flex flex-col">
              <span className="text-sm font-semibold">Display total price</span>
              <span className="text-xs text-muted">Before fees &amp; taxes</span>
            </span>
          </Switch>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-semibold lg:hidden"
          >
            <Icon name="filter" size={18} />
            Filters
            {active > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] text-white">
                {active}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-start gap-10 px-4 py-6 md:px-8 md:py-8">
        <aside
          aria-label="Filters"
          className="sticky top-6 hidden w-[300px] flex-none rounded-2xl border border-line-soft p-6 lg:block"
        >
          <FilterPanel key={panelKey} value={filters} count={count} onApply={apply} />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-6">
          <CategoryChips categories={categories} active={summary.category} />

          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="text-2xl font-extrabold md:text-[28px]">{heading}</h1>
            <span className="text-sm text-muted">
              {showTotal ? `Prices shown for ${MIN_HOURS} hours` : "Prices shown per hour"}
            </span>
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-line-soft p-8">
              <h2 className="text-lg font-bold">No cars match your search</h2>
              <p className="text-muted">
                {cars.length > 0
                  ? "Try removing a few filters or raising the price limit."
                  : "Try another city or different dates."}
              </p>
              {active > 0 ? (
                <button
                  type="button"
                  onClick={() => apply({ ...DEFAULT_FILTERS, sort: filters.sort })}
                  className="rounded-[14px] bg-ink px-5 py-3 font-semibold text-white"
                >
                  Clear filters
                </button>
              ) : (
                <Link href="/explore" className="rounded-[14px] bg-ink px-5 py-3 font-semibold text-white">
                  See all cars
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-x-7 gap-y-8">
                {results.slice(0, visible).map((car) => (
                  <CarCard key={car.id} car={car} showTotal={showTotal} query={summary.tripQuery} />
                ))}
              </div>
              {visible < results.length && (
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="h-[52px] rounded-[14px] border border-ink bg-white px-7 text-base font-semibold hover:bg-surface"
                  >
                    Load more cars
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
            <FilterPanel
              key={panelKey}
              value={filters}
              count={count}
              onApply={apply}
              onClose={() => setSheetOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
