/**
 * Booking times are India Standard Time wall clock (the app's ist_time_utils):
 * the user picks "20 Nov 10:00" meaning 10:00 IST, sent to the API as UTC.
 */
const IST_OFFSET_MS = 330 * 60_000;

/** `YYYY-MM-DDTHH:mm` (IST wall clock) → epoch ms, or NaN. */
export function istLocalToMs(local: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return NaN;
  return Date.parse(`${local}:00+05:30`);
}

/** epoch ms → `YYYY-MM-DDTHH:mm` in IST, for datetime-local inputs. */
export function msToIstLocal(ms: number) {
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 16);
}

/** Next full hour from now, plus `hoursAhead`, as an IST local value. */
export function defaultStart(hoursAhead = 2) {
  const now = Date.now() + hoursAhead * 3_600_000;
  return msToIstLocal(Math.ceil(now / 3_600_000) * 3_600_000);
}

const fmtShort = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});
const fmtLong = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});
const fmtMonth = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

const valid = (d: string | number | Date | null | undefined) => {
  if (d == null || d === "") return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** "20 Nov, 10:00 am" */
export const formatShort = (d: string | number | Date | null | undefined) => {
  const date = valid(d);
  return date ? fmtShort.format(date) : "—";
};
/** "20 Nov 2026, 10:00 am" */
export const formatLong = (d: string | number | Date | null | undefined) => {
  const date = valid(d);
  return date ? fmtLong.format(date) : "—";
};
/** "November 2026" */
export const formatMonth = (d: string | number | Date | null | undefined) => {
  const date = valid(d);
  return date ? fmtMonth.format(date) : "";
};

export const formatHours = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(1)} hrs`;
