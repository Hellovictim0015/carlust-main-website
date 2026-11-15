import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Markdown } from "@/components/Markdown";
import { TERMS, termsSection } from "@/lib/legal";

const CONTACT = `## Contact

For any queries, please contact us:
- Email: carlust0001@gmail.com
- Phone: +91 8000585654`;

/**
 * Only the Terms & Conditions exist in the app. The other policies show the
 * matching Terms sections until the business supplies dedicated policy text.
 */
const PAGES: Record<string, { title: string; body: () => string }> = {
  terms: { title: "Terms of service", body: () => TERMS },
  cancellation: {
    title: "Cancellation Policy",
    body: () => `# Cancellation Policy\n\n${termsSection("Cancellations & Refunds")}\n\n${CONTACT}`,
  },
  refund: {
    title: "Refund policy",
    body: () =>
      `# Refund policy\n\n${termsSection("Cancellations & Refunds")}\n\n## Security deposit\n- The security deposit is refundable and is returned after the trip as per policy.\n\n${CONTACT}`,
  },
  payments: {
    title: "Payments policy",
    body: () => `# Payments policy\n\n${termsSection("Booking & Payments")}\n\n${termsSection("Fuel Policy")}\n\n${CONTACT}`,
  },
  privacy: {
    title: "Privacy policy",
    body: () =>
      `# Privacy policy\n\nCarlust Automotive Pvt Ltd collects the details you give us — your phone number, name, email, identity documents and booking information — to run bookings, verify renters and hosts, and process payments.\n\n${CONTACT}`,
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: PAGES[slug]?.title ?? "Legal" };
}

export default function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="mx-auto h-96 max-w-3xl px-4 py-8" />}>
      <Legal params={params} />
    </Suspense>
  );
}

async function Legal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
      <nav aria-label="Legal" className="mb-8 flex flex-wrap gap-2">
        {Object.entries(PAGES).map(([s, p]) => (
          <Link
            key={s}
            href={`/legal/${s}`}
            aria-current={s === slug ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${s === slug ? "bg-ink text-white" : "border border-line hover:border-ink"}`}
          >
            {p.title}
          </Link>
        ))}
      </nav>
      <Markdown source={page.body()} />
    </div>
  );
}
