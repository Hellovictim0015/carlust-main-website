"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getBroadcasts, type Broadcast } from "@/app/actions/notifications";
import { formatShort } from "@/lib/datetime";

const SEEN_KEY = "carlust:notifications-seen";

const readSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) ?? "";
  } catch {
    return "";
  }
};

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

/**
 * Bell with the admin's announcements (sent from the admin panel's
 * Notifications page). Unread = newer than the last time the panel was opened.
 */
export function NotificationBell({ className = "" }: { className?: string }) {
  const [items, setItems] = useState<Broadcast[] | null>(null);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getBroadcasts().then((list) => {
      if (cancelled) return;
      setItems(list);
      setSeen(readSeen());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = (items ?? []).filter((n) => n.createdAt > seen).length;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && items?.length) {
      const newest = items[0].createdAt;
      try {
        localStorage.setItem(SEEN_KEY, newest);
      } catch {
        // Private mode: unread dot just won't persist.
      }
      setSeen(newest);
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        className="relative flex size-10 items-center justify-center rounded-full hover:bg-surface"
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-[18px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-line-soft bg-white shadow-float"
        >
          <p className="border-b border-line-soft px-4 py-3 font-bold">Notifications</p>
          {items === null ? (
            <p className="px-4 py-6 text-sm text-muted">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">You&apos;re all caught up. Offers and updates from Carlust will show here.</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-line-soft overflow-y-auto">
              {items.map((n) => {
                const inner = (
                  <>
                    <p className="font-semibold">{n.title}</p>
                    <p className="mt-0.5 text-sm whitespace-pre-wrap text-ink-3">{n.body}</p>
                    <p className="mt-1 text-xs text-muted">{formatShort(n.createdAt)}</p>
                  </>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      n.link.startsWith("/") ? (
                        <Link href={n.link} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-surface">
                          {inner}
                        </Link>
                      ) : (
                        <a href={n.link} target="_blank" rel="noopener noreferrer" className="block px-4 py-3 hover:bg-surface">
                          {inner}
                        </a>
                      )
                    ) : (
                      <div className="px-4 py-3">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
