import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HostPageHeader } from "@/components/host/HostSections";
import { Icon, type IconName } from "@/components/Icon";
import { Avatar } from "@/components/layout/HeaderAccount";
import { AccountButtons } from "@/components/profile/ProfileForms";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Menu · Hosting", robots: { index: false } };

const groups: { title: string; items: { href: string; label: string; icon: IconName }[] }[] = [
  {
    title: "Hosting",
    items: [
      { href: "/host/payments", label: "Payments & Transaction History", icon: "wallet" },
      { href: "/host/payments#bank", label: "Bank Accounts", icon: "wallet" },
      { href: "/host/listings/new", label: "List your car", icon: "car" },
      { href: "/host/calendar", label: "Self Book Management", icon: "calendar" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/profile?tab=personal", label: "Personal information", icon: "user" },
      { href: "/profile?tab=documents", label: "Document Verification", icon: "shield" },
      { href: "/", label: "Switch to Travelling", icon: "search" },
    ],
  },
  {
    title: "Support & Legal",
    items: [
      { href: "tel:+918000585654", label: "Help center · +91 8000585654", icon: "phone" },
      { href: "/legal/terms", label: "Terms of service", icon: "tag" },
      { href: "/legal/privacy", label: "Privacy policy", icon: "tag" },
      { href: "/legal/payments", label: "Payments policy", icon: "tag" },
    ],
  },
];

/** Host "Menu" tab (the app reuses its profile screen here). */
async function Menu() {
  const user = await requireUser("/host/menu");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-2xl border border-line-soft p-5">
        <Avatar name={user.name || user.phoneNumber} image={user.image} size={56} />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{user.name || user.phoneNumber}</p>
          <Link href="/profile" className="text-sm font-semibold underline">
            Show profile
          </Link>
        </div>
      </div>
      {groups.map((g) => (
        <section key={g.title} className="flex flex-col">
          <p className="px-1 pb-2 text-xs font-bold tracking-[.6px] text-muted">{g.title.toUpperCase()}</p>
          <ul className="divide-y divide-line-soft rounded-2xl border border-line-soft">
            {g.items.map((it) => (
              <li key={it.label}>
                <Link href={it.href} className="flex items-center gap-3 px-5 py-4 hover:bg-surface">
                  <Icon name={it.icon} size={20} />
                  <span className="flex-1 font-medium">{it.label}</span>
                  <Icon name="chevronRight" size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <AccountButtons />
    </div>
  );
}

export default function HostMenuPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <HostPageHeader title="Menu" />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-placeholder" />}>
        <Menu />
      </Suspense>
    </div>
  );
}
