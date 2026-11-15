"use client";

import type { ReactNode } from "react";

/** iOS-style switch from the app (AppSwitch). The whole row is the control. */
export function Switch({
  checked,
  onChange,
  children,
  className = "",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-3 text-left ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className={`relative h-[26px] w-11 flex-none rounded-full transition-colors ${checked ? "bg-brand" : "bg-line"}`}
      >
        <span
          className={`absolute top-[3px] left-[3px] size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)] transition-transform ${
            checked ? "translate-x-[18px]" : ""
          }`}
        />
      </span>
    </button>
  );
}
