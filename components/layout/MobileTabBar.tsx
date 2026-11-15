"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../Icon";
import { GUEST_TABS, HOST_TABS, isHostPath } from "./navItems";

/** Bottom tab bar on phones: guest tabs, or the host tabs inside /host (like the app's two shells). */
export function MobileTabBar() {
  const pathname = usePathname();
  const tabs = isHostPath(pathname) ? HOST_TABS : GUEST_TABS;

  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map(({ href, label, icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <Icon name={icon} size={22} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
