"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";

/** 1 large + 4 small photo grid with a full-screen viewer. */
export function PhotoGallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i == null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i == null ? i : (i - 1 + images.length) % images.length));
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, images.length]);

  if (images.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl bg-placeholder text-[#7a808c]">
        <Icon name="car" size={48} />
      </div>
    );
  }

  const tiles = images.slice(0, 5);
  return (
    <>
      <div className="relative grid h-[260px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:h-[420px]">
        {tiles.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`Open photo ${i + 1} of ${images.length}`}
            className={`relative bg-placeholder ${
              i === 0 ? "col-span-4 row-span-2 md:col-span-2" : "hidden md:block"
            } ${tiles.length === 1 ? "md:col-span-4" : ""}`}
          >
            <Image
              src={src}
              alt={i === 0 ? title : ""}
              fill
              priority={i === 0}
              sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "25vw"}
              className="object-cover transition-opacity hover:opacity-90"
            />
          </button>
        ))}
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => setOpen(0)}
            className="absolute right-4 bottom-4 rounded-xl border border-ink bg-white px-4 py-2 text-sm font-semibold shadow-card"
          >
            Show all photos ({images.length})
          </button>
        )}
      </div>

      {open != null && (
        <div role="dialog" aria-modal="true" aria-label="Photos" className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm">
              {open + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Close photos"
              className="flex size-10 items-center justify-center rounded-full bg-white/15 text-2xl"
            >
              ×
            </button>
          </div>
          <div className="relative flex-1">
            <Image src={images[open]} alt={`${title}, photo ${open + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
          <div className="flex justify-center gap-4 p-4">
            <button
              type="button"
              onClick={() => setOpen((open - 1 + images.length) % images.length)}
              className="rounded-full bg-white/15 px-5 py-2 font-semibold text-white"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setOpen((open + 1) % images.length)}
              className="rounded-full bg-white/15 px-5 py-2 font-semibold text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
