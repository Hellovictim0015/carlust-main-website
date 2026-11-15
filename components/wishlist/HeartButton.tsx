"use client";

import { Icon } from "../Icon";
import { useWishlist } from "./WishlistProvider";

export function HeartButton({ carId, title, className = "" }: { carId: string; title: string; className?: string }) {
  const { isSaved, isPending, toggle } = useWishlist();
  const saved = isSaved(carId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(carId);
      }}
      disabled={isPending(carId)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from Wishlist` : `Save ${title} to Wishlist`}
      className={`flex size-10 items-center justify-center rounded-full transition-colors ${
        saved ? "bg-white text-brand" : "bg-black/35 text-white hover:bg-black/50"
      } ${className}`}
    >
      <Icon name="heart" size={22} filled={saved} />
    </button>
  );
}
