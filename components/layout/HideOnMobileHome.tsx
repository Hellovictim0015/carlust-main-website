"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** On the home page, phones get the app layout, so the web header/footer hide below md. */
export function HideOnMobileHome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div className={pathname === "/" ? "hidden md:block" : "contents"}>{children}</div>;
}
