import { Suspense } from "react";
import { HeaderAccount, LoginButton } from "./HeaderAccount";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";
import { NotificationBell } from "./NotificationBell";

export function SiteHeader() {
  return (
    <header className="border-b border-line-soft bg-white">
      <nav
        aria-label="Main"
        className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-4 md:min-h-[72px] md:px-8"
      >
        <Logo />
        <Suspense fallback={<div className="hidden md:block" />}>
          <NavLinks />
        </Suspense>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Suspense fallback={<LoginButton />}>
            <HeaderAccount />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
