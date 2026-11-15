import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AddCarForm } from "@/components/host/AddCarForm";
import { getCategories, type Category } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getKycStatus } from "@/lib/backend";

export const metadata: Metadata = { title: "Add your car", robots: { index: false } };

async function Form() {
  const user = await requireUser("/host/listings/new");
  const [categories, kyc] = await Promise.all([getCategories().catch((): Category[] => []), getKycStatus()]);
  return (
    <AddCarForm
      categories={categories}
      name={user.name}
      email={user.email}
      identityVerified={user.isVerified || kyc?.status === "VERIFIED"}
      autoAvailable={kyc?.autoAvailable ?? false}
    />
  );
}

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <Link href="/host/listings" className="mb-2 inline-block text-sm font-semibold underline">← Back to listings</Link>
      <h1 className="text-[32px] font-extrabold tracking-[-.6px]">Add your car</h1>
      <p className="mt-1 mb-6 text-muted">Customer can book your Car 24 hours after you publish.</p>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-placeholder" />}>
        <Form />
      </Suspense>
    </div>
  );
}
