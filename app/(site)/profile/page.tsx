import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/layout/HeaderAccount";
import { AccountButtons, DocumentsForm, PersonalInfoForm, PhotoForm } from "@/components/profile/ProfileForms";
import { StatusBadge } from "@/components/trips/StatusBadge";
import { Verification } from "@/components/profile/Verification";
import { requireUser } from "@/lib/auth";
import { getKycStatus } from "@/lib/backend";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

/** Automatic (Aadhaar OTP + DL) or manual verification; manual only if the KYC API is unreachable. */
async function VerificationSection({
  fallbackStatus,
  result,
  message,
}: {
  fallbackStatus: "VERIFIED" | "VERIFYING" | "NOT_VERIFIED";
  /** Set when DigiLocker sends the user back: verified | review | partial | error. */
  result?: string;
  message?: string;
}) {
  const kyc = await getKycStatus();
  const banner =
    result && message && result !== "verified" ? (
      <p
        role="status"
        className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${
          result === "error" ? "bg-[#ffe6e6] text-[#c62828]" : "bg-[#fff3e6] text-[#a85f00]"
        }`}
      >
        {message}
      </p>
    ) : null;
  if (!kyc) return <DocumentsForm status={fallbackStatus} />;
  return (
    <>
      {banner}
      <Verification initial={kyc} />
    </>
  );
}

const TABS = [
  { key: "personal", label: "Personal information" },
  { key: "documents", label: "Document Verification" },
] as const;

async function Profile({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tab = sp.tab === "documents" ? "documents" : "personal";
  const user = await requireUser(`/profile?tab=${tab}`);
  const status =
    user.isVerified || user.identityVerificationStatus === "VERIFIED"
      ? "VERIFIED"
      : user.identityVerificationStatus === "VERIFYING" || user.documentsSubmittedForReview
        ? "VERIFYING"
        : "NOT_VERIFIED";
  const badge =
    status === "VERIFIED"
      ? ({ label: "Verified", tone: "completed" } as const)
      : status === "VERIFYING"
        ? ({ label: "Under review", tone: "ongoing" } as const)
        : ({ label: "Not Verified", tone: "cancelled" } as const);

  const navLink = "block rounded-xl px-3 py-2.5 hover:bg-surface";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 md:px-8 md:py-8 lg:flex-row lg:items-start">
      <aside aria-label="Profile menu" className="flex w-full flex-col gap-5 lg:w-[320px] lg:flex-none">
        <h1 className="text-[32px] font-extrabold tracking-[-.6px]">Profile</h1>
        <div className="flex items-center gap-4">
          <Avatar name={user.name || user.phoneNumber} image={user.image} size={60} />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{user.name || "Add your name"}</p>
            <StatusBadge label={badge.label} tone={badge.tone} />
          </div>
        </div>

        <Link href="/host" className="flex flex-col gap-1 rounded-2xl bg-ink p-5 text-white">
          <span className="font-bold">{user.isHost ? "Switch to Hosting Mode" : "Become a Host"}</span>
          <span className="text-sm text-night-text">It&apos;s easy to start hosting and earn extra income.</span>
        </Link>

        <nav className="flex flex-col text-[15px]">
          <p className="px-3 pt-2 pb-1 text-xs font-bold tracking-[.6px] text-muted">SETTINGS</p>
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/profile?tab=${t.key}`}
              aria-current={tab === t.key ? "page" : undefined}
              className={`${navLink} ${tab === t.key ? "bg-surface font-semibold" : ""}`}
            >
              {t.label}
            </Link>
          ))}
          <Link href="/trips" className={navLink}>Trips</Link>
          <Link href="/wishlist" className={navLink}>Wishlists</Link>
          <Link href="/messages" className={navLink}>Messages</Link>
          <p className="px-3 pt-4 pb-1 text-xs font-bold tracking-[.6px] text-muted">HOSTING</p>
          <Link href="/host" className={navLink}>Switch to Hosting Mode</Link>
          <Link href="/host/listings/new" className={navLink}>List your car</Link>
          <p className="px-3 pt-4 pb-1 text-xs font-bold tracking-[.6px] text-muted">SUPPORT</p>
          <a href="tel:+918000585654" className={navLink}>Help center · +91 8000585654</a>
          <p className="px-3 pt-4 pb-1 text-xs font-bold tracking-[.6px] text-muted">LEGAL</p>
          <Link href="/legal/terms" className={navLink}>Terms of service</Link>
          <Link href="/legal/privacy" className={navLink}>Privacy policy</Link>
          <Link href="/legal/payments" className={navLink}>Payments policy</Link>
          <Link href="/legal/refund" className={navLink}>Refund policy</Link>
        </nav>
        <AccountButtons />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col gap-6 rounded-2xl border border-line-soft p-5 md:p-8">
        {tab === "personal" ? (
          <>
            <h2 className="text-2xl font-bold">Personal information</h2>
            <PhotoForm image={user.image} name={user.name || "C"} />
            <PersonalInfoForm name={user.name} email={user.email} phone={user.phoneNumber} dob={user.dateOfBirth} />
          </>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-bold">Verify Your Identity</h2>
              <p className="mt-1 text-muted">
                Verify instantly with Aadhaar and your driving licence, or upload your documents for review.
              </p>
            </div>
            <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-placeholder" />}>
              <VerificationSection
                fallbackStatus={status}
                result={typeof sp.kyc === "string" ? sp.kyc : undefined}
                message={typeof sp.kycMsg === "string" ? sp.kycMsg : undefined}
              />
            </Suspense>
          </>
        )}
      </section>
    </div>
  );
}

export default function ProfilePage({ searchParams }: PageProps<"/profile">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="mx-auto h-96 max-w-7xl px-4 py-8" />}>
      <Profile searchParams={searchParams} />
    </Suspense>
  );
}
