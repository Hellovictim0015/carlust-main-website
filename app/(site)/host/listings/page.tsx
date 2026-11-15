import type { Metadata } from "next";
import { Suspense } from "react";
import { AddCarLink, HostPageHeader, ListingsGrid } from "@/components/host/HostSections";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Listing · Hosting", robots: { index: false } };

/** Host "Listing" tab (host_listing_screen). */
async function Listings() {
  await requireUser("/host/listings");
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <HostPageHeader title="My Listings" sub="Turn cars on or off for booking, or add a new one." action={<AddCarLink />} />
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-placeholder" />}>
        <ListingsGrid />
      </Suspense>
    </div>
  );
}

export default function HostListingsPage() {
  return (
    <Suspense fallback={<div aria-busy="true" className="mx-auto h-96 max-w-7xl px-4 py-8" />}>
      <Listings />
    </Suspense>
  );
}
