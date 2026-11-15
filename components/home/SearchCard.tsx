"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import type { Category } from "@/lib/api";
import { Icon } from "../Icon";
import { PlaceInput } from "../search/PlaceInput";

const modes = [
  { value: "pickup", label: "Pick Up Myself" },
  { value: "doorstep", label: "Doorstep delivery" },
  { value: "driver", label: "Cars With Driver" },
] as const;

type Mode = (typeof modes)[number]["value"];

/** Categories the design surfaces on the home page, in this order. */
const featured = ["Sedan", "Luxury", "SUV"];

function Field({
  label,
  htmlFor,
  children,
  divider = true,
}: {
  label: ReactNode;
  htmlFor: string;
  children: ReactNode;
  divider?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col lg:flex-[1_1_170px] gap-1.5 px-4 py-3 md:px-[22px] md:py-3.5 ${
        divider ? "border-b border-line-soft lg:border-r lg:border-b-0" : ""
      }`}
    >
      <label htmlFor={htmlFor} className="flex items-center gap-1 text-sm text-ink-3">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full min-w-0 bg-transparent text-lg font-semibold text-ink outline-none placeholder:text-muted";

export function SearchCard({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const id = useId();
  const [mode, setMode] = useState<Mode>("pickup");
  const [where, setWhere] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [transmission, setTransmission] = useState("");

  const browse = featured
    .map((name) => categories.find((c) => c.name.toLowerCase() === name.toLowerCase()))
    .filter((c): c is Category => Boolean(c));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (where.trim()) params.set("where", where.trim());
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    if (transmission) params.set("transmission", transmission);
    if (mode !== "pickup") params.set("mode", mode);
    const qs = params.toString();
    router.push(qs ? `/explore?${qs}` : "/explore");
  }

  return (
    <div className="relative mx-auto -mt-[118px] flex max-w-[1300px] flex-col gap-5 rounded-[28px] bg-white p-5 shadow-float md:gap-[22px] md:px-8 md:py-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <fieldset className="flex flex-wrap gap-x-7 gap-y-3">
          <legend className="sr-only">How do you want the car</legend>
          {modes.map((m) => {
            const checked = mode === m.value;
            return (
              <label key={m.value} className="flex cursor-pointer items-center gap-2.5 text-[15px] text-ink-2">
                <input
                  type="radio"
                  name={`${id}-mode`}
                  value={m.value}
                  checked={checked}
                  onChange={() => setMode(m.value)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`flex size-[22px] flex-none items-center justify-center rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 ${
                    checked ? "bg-ink" : "border-[1.5px] border-[#9aa0ab]"
                  }`}
                >
                  {checked && <span className="size-2 rounded-full bg-white" />}
                </span>
                {m.label}
              </label>
            );
          })}
        </fieldset>
        <span className="flex items-center gap-1.5 text-[15px] font-semibold text-ink-3">
          <span className="text-success">
            <Icon name="shield" size={18} />
          </span>
          Security deposit refundable
        </span>
      </div>

      <form
        role="search"
        onSubmit={onSubmit}
        className="flex flex-col rounded-[22px] border border-line lg:flex-row lg:items-center lg:py-1.5 lg:pr-2.5 lg:pl-1"
      >
        <Field label="Where" htmlFor={`${id}-where`}>
          <PlaceInput
            id={`${id}-where`}
            value={where}
            onChange={setWhere}
            // Date search needs a city (the API searches one city at a time).
            required={Boolean(start || end)}
            className={inputClass}
            listClassName="-left-4 min-w-[340px] md:-left-[22px]"
          />
        </Field>
        <Field label="Start Date Time" htmlFor={`${id}-start`}>
          <input
            id={`${id}-start`}
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className={`${inputClass} ${start ? "" : "text-muted"}`}
          />
        </Field>
        <Field label="End Date Time" htmlFor={`${id}-end`}>
          <input
            id={`${id}-end`}
            type="datetime-local"
            value={end}
            min={start || undefined}
            onChange={(e) => setEnd(e.target.value)}
            className={`${inputClass} ${end ? "" : "text-muted"}`}
          />
        </Field>
        <Field label="Transmission" htmlFor={`${id}-transmission`} divider={false}>
          <select
            id={`${id}-transmission`}
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Any Transmission</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
          </select>
        </Field>
        <div className="flex gap-2.5 p-3 lg:p-0">
          <Link
            href="/explore?filters=1"
            aria-label="Filters"
            className="flex size-[60px] flex-none items-center justify-center rounded-2xl border border-line text-ink hover:bg-surface"
          >
            <Icon name="filter" size={24} />
          </Link>
          <button
            type="submit"
            className="flex h-[60px] flex-1 items-center justify-center gap-2.5 rounded-2xl bg-brand px-[30px] text-[17px] font-bold text-white shadow-brand transition-colors hover:bg-brand-deep lg:flex-none"
          >
            <Icon name="search" size={20} />
            Search
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="mr-2 text-lg font-bold">Browse</span>
        <Link
          href="/explore"
          className="flex items-center gap-2.5 rounded-[14px] border border-brand bg-brand px-5 py-[11px] text-base font-semibold whitespace-nowrap text-white"
        >
          <Icon name="car" size={20} />
          All Cars
        </Link>
        {browse.map((c) => (
          <Link
            key={c.id}
            href={`/explore?category=${encodeURIComponent(c.name)}`}
            className="flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-line bg-white px-5 py-[11px] text-base font-semibold whitespace-nowrap text-ink hover:border-ink"
          >
            <Icon name="car" size={20} />
            {c.name}
          </Link>
        ))}
        <Link
          href="/explore"
          className="flex items-center gap-1.5 px-2 py-[11px] text-[15px] font-semibold text-ink underline underline-offset-4"
        >
          More categories
        </Link>
      </div>
    </div>
  );
}
