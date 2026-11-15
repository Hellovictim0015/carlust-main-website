"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../Icon";
import { HOST_TABS, isHostPath } from "./navItems";

const guestLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/#how", label: "How it works" },
  { href: "/#host", label: "Become a Host" },
  { href: "#footer", label: "Help center" },
];

const linkClass = (active: boolean) =>
  `flex items-center gap-1.5 border-b-2 px-0.5 pt-6 pb-[22px] text-[15px] font-medium transition-colors ${
    active ? "border-brand text-ink" : "border-transparent text-ink-3 hover:text-ink"
  }`;

/** Top navigation; switches to the host tabs (Today, Booking, …) inside /host. */
export function NavLinks() {
  const pathname = usePathname();

  if (isHostPath(pathname)) {
    return (
      <div className="hidden items-center gap-5 md:flex xl:gap-8">
        {HOST_TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              aria-label={t.label}
              title={t.label}
              className={linkClass(active)}
            >
              <Icon name={t.icon} size={18} />
              <span className="hidden lg:inline">{t.label}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-8 md:flex">
      {guestLinks.map(({ href, label }) => {
        const active = !href.includes("#") && pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={linkClass(active)}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}

/** "Switch to Hosting Mode" ⇄ "Switch to Travelling", depending on the side you're on. */
export function ModeSwitchLink({ isHost }: { isHost: boolean }) {
  const pathname = usePathname();
  const inHost = isHostPath(pathname);
  return (
    <Link href={inHost ? "/" : "/host"} className="hidden text-[15px] font-semibold hover:underline lg:block">
      {inHost ? "Switch to Travelling" : isHost ? "Switch to Hosting Mode" : "Become a Host"}
    </Link>
  );
}
