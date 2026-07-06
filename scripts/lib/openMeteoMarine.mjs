import { fetchJson } from "./http.mjs";
import { LOCATION } from "../config.mjs";

const M_TO_FT = 3.28084;
const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/** Nearest 8-point compass label for a direction in degrees. */
function degToLabel(deg) {
  if (deg == null) return null;
  return DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

/** Index of the hourly slot containing (or immediately before) `now`. */
function currentIndex(times, now) {
  const idx = times.findIndex((t) => t > now);
  return idx === -1 ? times.length - 1 : Math.max(0, idx - 1);
}

/**
 * Hourly wave-height series (for the waves tile forecast window) plus per-day
 * max wave height (for the 7-day trip planner) and a "right now" snapshot
 * (combined/swell/wind-wave height, period, direction), from Open-Meteo
 * Marine. The previous day is included so a window reaching before `now`
 * still has data.
 */
export async function fetchMarine(now = new Date()) {
  const url =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}` +
    `&hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height` +
    `&timezone=UTC&past_days=1&forecast_days=8`;
  const data = await fetchJson(url, {}, "Open-Meteo Marine");

  const times = data.hourly.time.map((t) => new Date(`${t}:00Z`));
  const heightsM = data.hourly.wave_height;

  const hourly = times.map((time, i) => ({
    time,
    heightFt: Math.round(heightsM[i] * M_TO_FT * 10) / 10,
  }));

  const dailyMaxWaveFt = new Map();
  times.forEach((time, i) => {
    const key = time.toISOString().slice(0, 10);
    const ft = heightsM[i] * M_TO_FT;
    if (!dailyMaxWaveFt.has(key) || dailyMaxWaveFt.get(key) < ft) dailyMaxWaveFt.set(key, ft);
  });

  const i = currentIndex(times, now);
  const round1 = (m) => (m == null ? null : Math.round(m * M_TO_FT * 10) / 10);
  const current = {
    periodSec: data.hourly.wave_period?.[i] ?? null,
    direction: degToLabel(data.hourly.wave_direction?.[i]),
    swellHeightFt: round1(data.hourly.swell_wave_height?.[i]),
    swellPeriodSec: data.hourly.swell_wave_period?.[i] ?? null,
    swellDirection: degToLabel(data.hourly.swell_wave_direction?.[i]),
    windWaveHeightFt: round1(data.hourly.wind_wave_height?.[i]),
  };

  return { hourly, dailyMaxWaveFt, current };
}
