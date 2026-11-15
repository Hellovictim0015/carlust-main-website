import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreView, type SearchSummary } from "@/components/explore/ExploreView";
import { getCars, getCategories, searchAvailableCars, type Car, type Category } from "@/lib/api";
import { parseFilters } from "@/lib/filters";

export const metadata: Metadata = {
  title: "Explore cars",
  description: "Browse self-drive cars by the hour. Filter by price, transmission, seats, features, driver and doorstep delivery.",
};

type Params = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

/** `datetime-local` value (entered in India) → ISO string, or null if invalid. */
function istToIso(local: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const d = new Date(`${local}:00+05:30`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const display = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

const matchesCity = (car: Car, where: string) => {
  const q = where.toLowerCase();
  return car.city.toLowerCase().includes(q) || q.includes(car.city.toLowerCase());
};

async function Explore({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const where = first(params.where);
  const category = first(params.category);
  const startIso = istToIso(first(params.start));
  const endIso = istToIso(first(params.end));
  const hasWindow = Boolean(where && startIso && endIso && endIso > startIso);

  const [cars, categories] = await Promise.all([
    (hasWindow
      ? searchAvailableCars(where, startIso!, endIso!)
      : getCars(category || undefined).then((all) => (where ? all.filter((c) => matchesCity(c, where)) : all))
    ).catch(() => null),
    getCategories().catch((): Category[] => []),
  ]);

  if (cars === null) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <h1 className="text-2xl font-extrabold">We couldn&apos;t load cars right now</h1>
        <p className="mt-2 text-muted">Please refresh the page in a moment.</p>
      </div>
    );
  }

  const summary: SearchSummary = {
    where,
    start: hasWindow ? display.format(new Date(startIso!)) : "",
    end: hasWindow ? display.format(new Date(endIso!)) : "",
    category: hasWindow ? "" : category,
    tripQuery: hasWindow ? new URLSearchParams({ start: first(params.start), end: first(params.end) }).toString() : "",
  };

  return (
    <ExploreView
      // Remount when the server-side search changes so client state resets.
      key={`${where}|${startIso}|${endIso}|${category}`}
      cars={cars}
      initialFilters={parseFilters(params)}
      summary={summary}
      categories={categories}
      openFilters={first(params.filters) === "1"}
    />
  );
}

function ExploreSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading cars" className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-8 h-14 animate-pulse rounded-full bg-placeholder" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-7">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-[200px] animate-pulse rounded-xl bg-placeholder" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-placeholder" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-placeholder" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExplorePage({ searchParams }: PageProps<"/explore">) {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <Explore searchParams={searchParams} />
    </Suspense>
  );
}
