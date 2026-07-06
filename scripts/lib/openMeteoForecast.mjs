import { fetchJson } from "./http.mjs";
import { LOCATION } from "../config.mjs";

const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/** Nearest 8-point compass label for a wind direction in degrees. */
function degToLabel(deg) {
  return DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

/** "7am"-style hour label in Oak Island local time. */
export function hourLabel(date) {
  return date
    .toLocaleTimeString("en-US", { hour: "numeric", timeZone: "America/New_York" })
    .replace(" ", "")
    .toLowerCase();
}

// Open-Meteo weather codes for thunderstorms.
const STORM_CODES = new Set([95, 96, 99]);

/**
 * Selects the hourly slots spanning `before` hours before to `after` hours
 * after the slot containing `now`. Items must be sorted ascending by `.time`.
 * With the defaults this yields the 7 slots from 2h prior to 4h ahead.
 */
export function windowAround(items, now, before = 2, after = 4) {
  if (!items.length) return [];
  let currentIdx = items.findIndex((it) => it.time > now);
  currentIdx = currentIdx === -1 ? items.length - 1 : Math.max(0, currentIdx - 1);
  const start = Math.max(0, currentIdx - before);
  const end = Math.min(items.length, currentIdx + after + 1);
  return items.slice(start, end);
}

/**
 * Hourly wind + precipitation series from Open-Meteo's forecast API. Includes
 * the previous day so a window reaching before `now` still has data. Powers
 * the wind arrows on the waves tile, the precip labels on the weather tile,
 * and the 7-day hourly wind-speed heatmap on the trip planner (hence
 * `forecast_days=8`, matching the marine forecast's horizon).
 */
export async function fetchHourlyForecast() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}` +
    `&hourly=precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,weathercode` +
    `&wind_speed_unit=mph&precipitation_unit=inch&timezone=UTC&past_days=1&forecast_days=8`;
  const data = await fetchJson(url, {}, "Open-Meteo Forecast");
  const h = data.hourly;

  return h.time.map((t, i) => {
    const deg = h.wind_direction_10m?.[i] ?? 0;
    return {
      time: new Date(`${t}:00Z`),
      label: hourLabel(new Date(`${t}:00Z`)),
      pct: Math.round(h.precipitation_probability?.[i] ?? 0),
      precipIn: Math.round((h.precipitation?.[i] ?? 0) * 100) / 100,
      windSpeedMph: Math.round(h.wind_speed_10m?.[i] ?? 0),
      windDirLabel: degToLabel(deg),
      storm: STORM_CODES.has(h.weathercode?.[i] ?? 0),
    };
  });
}
