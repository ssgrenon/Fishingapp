import { fetchJson } from "./http.mjs";
import { LOCATION } from "../config.mjs";

const M_TO_FT = 3.28084;

/**
 * Hourly wave-height series (for the waves tile forecast window) plus per-day
 * max wave height (for the 7-day trip planner), from Open-Meteo Marine. The
 * previous day is included so a window reaching before `now` still has data.
 */
export async function fetchMarine() {
  const url =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}` +
    `&hourly=wave_height&timezone=UTC&past_days=1&forecast_days=8`;
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

  return { hourly, dailyMaxWaveFt };
}
