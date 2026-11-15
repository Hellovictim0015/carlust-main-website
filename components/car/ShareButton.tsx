"use client";

import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
          } catch {
            // Dismissed.
          }
          return;
        }
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy this link", url);
        }
      }}
      className="rounded-xl px-3 py-2 text-sm font-semibold underline underline-offset-4 hover:bg-surface"
    >
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
