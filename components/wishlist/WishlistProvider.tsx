"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getFavoriteIds, toggleFavorite } from "@/app/actions/wishlist";
import { loginHref } from "@/lib/nav";

type Ctx = {
  isSaved: (carId: string) => boolean;
  isPending: (carId: string) => boolean;
  toggle: (carId: string) => void;
};

const WishlistContext = createContext<Ctx | null>(null);

/** Shared Wishlists state for every heart button (the app's favoritesProvider). */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    getFavoriteIds().then((list) => !cancelled && setIds(new Set(list)));
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(
    (carId: string) => {
      const save = !ids.has(carId);
      setPending((p) => new Set(p).add(carId));
      // Optimistic, reverted on failure.
      setIds((s) => {
        const n = new Set(s);
        if (save) n.add(carId);
        else n.delete(carId);
        return n;
      });
      toggleFavorite(carId, save).then((res) => {
        setPending((p) => {
          const n = new Set(p);
          n.delete(carId);
          return n;
        });
        if (res.ok) {
          if (window.location.pathname.startsWith("/wishlist")) router.refresh();
          return;
        }
        setIds((s) => {
          const n = new Set(s);
          if (save) n.delete(carId);
          else n.add(carId);
          return n;
        });
        if (res.needLogin) router.push(loginHref(window.location.pathname + window.location.search));
        else window.alert(res.error);
      });
    },
    [ids, router],
  );

  const value = useMemo<Ctx>(
    () => ({ isSaved: (id) => ids.has(id), isPending: (id) => pending.has(id), toggle }),
    [ids, pending, toggle],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
