import { Suspense } from "react";
import { Hero } from "@/components/home/Hero";
import { MobileHome } from "@/components/home/MobileHome";
import { NearbyCars } from "@/components/home/NearbyCars";
import { SearchCard } from "@/components/home/SearchCard";
import { Features, FinalCta, HostCta, HowItWorks } from "@/components/home/Sections";
import { getCars, getCategories, getFeaturedCars, type Category } from "@/lib/api";

async function SearchSection() {
  // Browse row still shows "All Cars" if the API is down.
  const categories: Category[] = await getCategories().catch(() => []);
  return <SearchCard categories={categories} />;
}

async function CarsSection() {
  const cars = await getFeaturedCars(8).catch(() => null);
  if (cars === null) {
    return (
      <p className="rounded-2xl border border-line-soft p-6 text-muted">
        We couldn&apos;t load cars right now. Please refresh the page in a moment.
      </p>
    );
  }
  if (cars.length === 0) {
    return <p className="text-muted">No cars are listed right now. Please check back soon.</p>;
  }
  return <NearbyCars cars={cars} />;
}

/** Phone home: the app's Explore screen. */
async function MobileSection() {
  const [cars, categories] = await Promise.all([
    getCars().catch(() => []),
    getCategories().catch((): Category[] => []),
  ]);
  return <MobileHome cars={cars} categories={categories} />;
}

function CarsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading cars" className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-[200px] animate-pulse rounded-xl bg-placeholder" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-placeholder" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-placeholder" />
        </div>
      ))}
    </div>
  );
}

function MobileSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4 p-4 md:hidden">
      <div className="h-[52px] animate-pulse rounded-[28px] bg-placeholder" />
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded-xl bg-placeholder" />
        ))}
      </div>
      <div className="h-[260px] animate-pulse rounded-xl bg-placeholder" />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<MobileSkeleton />}>
        <MobileSection />
      </Suspense>

      {/* Tablet and desktop: the web design. */}
      <div className="hidden md:block">
        <section id="search" aria-label="Search cars" className="scroll-mt-4 px-3 pt-4 md:px-6">
          <div className="mx-auto max-w-[1392px]">
            <Hero />
            <div className="px-1 md:px-0">
              <Suspense fallback={<SearchCard categories={[]} />}>
                <SearchSection />
              </Suspense>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-12 pb-[72px] md:px-8">
          <Suspense fallback={<CarsSkeleton />}>
            <CarsSection />
          </Suspense>
        </section>

        <Features />
        <HowItWorks />
        <HostCta />
        <FinalCta />
      </div>
    </>
  );
}
