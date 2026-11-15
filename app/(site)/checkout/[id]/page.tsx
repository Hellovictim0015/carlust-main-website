import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { getCarDetail } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { defaultStart, istLocalToMs, msToIstLocal } from "@/lib/datetime";

export const metadata: Metadata = { title: "CheckOut", robots: { index: false } };

async function Checkout({ params, searchParams }: PageProps<"/checkout/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const qs = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])),
  ).toString();
  const user = await requireUser(`/checkout/${id}${qs ? `?${qs}` : ""}`);

  const car = await getCarDetail(id);
  if (!car) notFound();

  let start = one(sp.start);
  let end = one(sp.end);
  if (!Number.isFinite(istLocalToMs(start))) start = defaultStart();
  if (!Number.isFinite(istLocalToMs(end)) || istLocalToMs(end) <= istLocalToMs(start)) {
    end = msToIstLocal(istLocalToMs(start) + 12 * 3_600_000);
  }

  return (
    <CheckoutView
      car={car}
      initialStart={start}
      initialEnd={end}
      initialDelivery={one(sp.delivery) === "1"}
      user={{ name: user.name, email: user.email, isVerified: user.isVerified }}
    />
  );
}

export default function Page(props: PageProps<"/checkout/[id]">) {
  return (
    <Suspense
      fallback={
        <div aria-busy="true" className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <div className="h-[480px] animate-pulse rounded-2xl bg-placeholder" />
        </div>
      }
    >
      <Checkout {...props} />
    </Suspense>
  );
}
