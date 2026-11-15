"use client";

import { useEffect, useId, useRef, useState } from "react";
import { suggestPlaces, type PlaceSuggestion } from "@/app/actions/places";
import { Icon } from "../Icon";

/**
 * "Where" field with Google place suggestions (app's Destination screen):
 * debounced lookup, arrow keys + Enter to pick, Escape to close.
 * Picking a suggestion sets the city (its main text).
 */
export function PlaceInput({
  value,
  onChange,
  id,
  className = "",
  placeholder = "Enter Destination",
  required = false,
  autoFocus = false,
  listClassName = "",
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  listClassName?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-list`;
  const [items, setItems] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  /** Debounced lookup as the user types (app uses a 500ms debounce). */
  function lookup(text: string) {
    if (timer.current) clearTimeout(timer.current);
    const q = text.trim();
    const n = ++seq.current;
    if (q.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    timer.current = setTimeout(async () => {
      const res = await suggestPlaces(q);
      if (n !== seq.current) return; // a newer query is in flight
      setItems(res);
      setActive(-1);
      setLoading(false);
    }, 300);
  }

  function pick(s: PlaceSuggestion) {
    seq.current++;
    if (timer.current) clearTimeout(timer.current);
    onChange(s.mainText);
    setOpen(false);
    setItems([]);
  }

  const showList = open && (items.length > 0 || loading);

  return (
    <div className="relative w-full">
      <input
        id={inputId}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          lookup(e.target.value);
        }}
        onFocus={() => items.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!showList || !items.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % items.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            pick(items[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={autoFocus}
        required={required}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className={className}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-line-soft bg-white py-2 shadow-float ${listClassName}`}
        >
          {loading && items.length === 0 && <li className="px-4 py-3 text-sm text-muted">Searching…</li>}
          {items.map((s, i) => (
            <li
              key={`${s.mainText}-${s.secondaryText}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 ${i === active ? "bg-surface" : ""}`}
            >
              <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-surface">
                <Icon name="pin" size={20} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-ink">{s.mainText}</span>
                {s.secondaryText && <span className="block truncate text-sm text-muted">{s.secondaryText}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
