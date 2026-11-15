import type { IconName } from "../Icon";

export type NavItem = { href: string; label: string; icon: IconName; match: (path: string) => boolean };

/** Host side tabs, same order as the app's HostTabShell. */
export const HOST_TABS: NavItem[] = [
  { href: "/host", label: "Today", icon: "clock", match: (p) => p === "/host" },
  { href: "/host/bookings", label: "Booking", icon: "key", match: (p) => p.startsWith("/host/bookings") },
  { href: "/host/calendar", label: "Calendar", icon: "calendar", match: (p) => p.startsWith("/host/calendar") },
  { href: "/host/listings", label: "Listing", icon: "car", match: (p) => p.startsWith("/host/listings") },
  { href: "/host/messages", label: "Messages", icon: "chat", match: (p) => p.startsWith("/host/messages") },
  {
    href: "/host/menu",
    label: "Menu",
    icon: "filter",
    match: (p) => p.startsWith("/host/menu") || p.startsWith("/host/payments"),
  },
];

/** Guest side tabs (mobile bottom bar), same as the app's GuestTabShell. */
export const GUEST_TABS: NavItem[] = [
  { href: "/", label: "Explore", icon: "search", match: (p) => p === "/" || p.startsWith("/explore") || p.startsWith("/cars") },
  { href: "/wishlist", label: "Wishlist", icon: "heart", match: (p) => p.startsWith("/wishlist") },
  { href: "/trips", label: "Trips", icon: "car", match: (p) => p.startsWith("/trips") },
  { href: "/messages", label: "Messages", icon: "chat", match: (p) => p.startsWith("/messages") },
  { href: "/profile", label: "Profile", icon: "user", match: (p) => p.startsWith("/profile") },
];

export const isHostPath = (p: string) => p === "/host" || p.startsWith("/host/");
