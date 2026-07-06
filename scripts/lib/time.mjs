import { TIME_ZONE } from "../config.mjs";

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

/** Local wall-clock Y/M/D/H/M/S at `refDate`, resolved via Intl (DST-aware). */
function wallClockParts(refDate) {
  const parts = wallClockFormatter.formatToParts(refDate).reduce((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  if (parts.hour === "24") parts.hour = "0"; // Intl quirk at local midnight
  return parts;
}

/** Returns the UTC Date instant corresponding to local (TIME_ZONE) midnight on refDate's local calendar day. */
export function localMidnight(refDate) {
  const p = wallClockParts(refDate);
  const asIfUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const offsetMs = asIfUtc - refDate.getTime();
  const localMidnightAsIfUtc = Date.UTC(+p.year, +p.month - 1, +p.day, 0, 0, 0);
  return new Date(localMidnightAsIfUtc - offsetMs);
}

/** YYYYMMDD for refDate's local calendar day, as required by the NOAA CO-OPS API. */
export function localYyyymmdd(refDate) {
  const p = wallClockParts(refDate);
  return `${p.year}${p.month}${p.day}`;
}

/** Local calendar date (YYYY-MM-DD) offset by `days` from refDate, in TIME_ZONE. */
export function localDateOffset(refDate, days) {
  const midnight = localMidnight(refDate);
  const shifted = new Date(midnight.getTime() + days * 86_400_000);
  const p = wallClockParts(shifted);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Local calendar date (YYYY-MM-DD) and hour-of-day (0-23) for refDate, in TIME_ZONE. */
export function localDateAndHour(refDate) {
  const p = wallClockParts(refDate);
  return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour };
}
