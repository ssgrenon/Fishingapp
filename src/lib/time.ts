const TIME_ZONE = "America/New_York";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parses a plain "YYYY-MM-DD" calendar date (no time/zone) without any timezone conversion. */
function parseCalendarDate(dateStr: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, m, d };
}

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatLongDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDayShort(dateStr: string): string {
  const { y, m, d } = parseCalendarDate(dateStr);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function formatDateShort(dateStr: string): string {
  const { m, d } = parseCalendarDate(dateStr);
  return `${MONTHS[m - 1]} ${d}`;
}

/** Hours-since-local-midnight (Oak Island time), as a float, for placing points on a 0-26h arc. */
export function hourOfDay(iso: string, midnightIso: string): number {
  const ms = new Date(iso).getTime() - new Date(midnightIso).getTime();
  return ms / 3_600_000;
}

const wallClockFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/**
 * ISO timestamp for local midnight (Oak Island time) on the day of the given
 * ISO timestamp. Computed by measuring the actual UTC offset at that instant
 * (via Intl) rather than assuming a fixed EDT/EST offset, so it stays correct
 * across the DST transition.
 */
export function localMidnightIso(iso: string): string {
  const refDate = new Date(iso);
  const parts = wallClockFormatter.formatToParts(refDate).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  const hour = parts.hour === "24" ? "0" : parts.hour; // Intl quirk: midnight can format as "24" with hour12:false
  const asIfUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +hour, +parts.minute, +parts.second);
  const offsetMs = asIfUtc - refDate.getTime();
  const localMidnightAsIfUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, 0, 0, 0);
  return new Date(localMidnightAsIfUtc - offsetMs).toISOString();
}

export function relativeTime(iso: string, nowIso: string): string {
  const diffMs = new Date(nowIso).getTime() - new Date(iso).getTime();
  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
